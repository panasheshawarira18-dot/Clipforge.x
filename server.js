import express from "express";
import cors from "cors";
import multer from "multer";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = process.cwd();
const WORK = path.join(ROOT, "work");
fs.mkdirSync(WORK, { recursive: true });

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(ROOT, "public")));

const upload = multer({
  dest: WORK,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }
});

function id() { return crypto.randomBytes(8).toString("hex"); }
function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args);
    let out="", err="";
    p.stdout.on("data", d => out += d);
    p.stderr.on("data", d => err += d);
    p.on("close", code => code === 0 ? resolve(out) : reject(new Error(err || `${cmd} exited ${code}`)));
  });
}

app.get("/api/health", (_, res) => res.json({ ok:true }));

app.post("/api/upload", upload.single("video"), (req,res) => {
  if (!req.file) return res.status(400).json({error:"No video uploaded"});
  const job = id();
  const ext = path.extname(req.file.originalname) || ".mp4";
  const dir = path.join(WORK, job);
  fs.mkdirSync(dir, {recursive:true});
  const input = path.join(dir, "input" + ext);
  fs.renameSync(req.file.path, input);
  res.json({job, name:req.file.originalname});
});

app.post("/api/youtube", async (req,res) => {
  const {url} = req.body || {};
  if (!url || !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(url))
    return res.status(400).json({error:"Enter a valid YouTube URL."});
  const job=id(), dir=path.join(WORK,job);
  fs.mkdirSync(dir,{recursive:true});
  try {
    // yt-dlp must be installed on the host.
    await run("yt-dlp", ["--no-playlist","-f","bv*[height<=1080]+ba/b[height<=1080]","--merge-output-format","mp4","-o",path.join(dir,"input.%(ext)s"),url]);
    const input=fs.readdirSync(dir).find(x=>x.startsWith("input."));
    if(!input) throw new Error("Video download did not produce a file.");
    res.json({job,name:input});
  } catch(e) {
    fs.rmSync(dir,{recursive:true,force:true});
    res.status(500).json({error:"Could not fetch the video. Make sure yt-dlp and FFmpeg are installed and that you have permission to use the video."});
  }
});

app.post("/api/cut", async (req,res) => {
  const {job, clipLength=30, start=0, count=5, vertical=false} = req.body || {};
  const dir=path.join(WORK,String(job));
  if(!fs.existsSync(dir)) return res.status(404).json({error:"Job not found"});
  const input=fs.readdirSync(dir).find(x=>x.startsWith("input."));
  if(!input) return res.status(404).json({error:"Input video not found"});
  const len=Math.max(1,Math.min(300,Number(clipLength)));
  const n=Math.max(1,Math.min(50,Number(count)));
  const s=Math.max(0,Number(start)||0);
  const outputs=[];
  try {
    for(let i=0;i<n;i++){
      const out=`clip-${String(i+1).padStart(2,"0")}.mp4`;
      const args=["-y","-ss",String(s+i*len),"-i",path.join(dir,input),"-t",String(len),
        "-c:v","libx264","-preset","veryfast","-crf","23","-c:a","aac","-movflags","+faststart"];
      if(vertical) args.push("-vf","scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2");
      args.push(path.join(dir,out));
      await run("ffmpeg",args);
      outputs.push(`/api/file/${job}/${out}`);
    }
    res.json({clips:outputs});
  } catch(e) {
    res.status(500).json({error:"FFmpeg could not create the clips. Check that the source video is valid."});
  }
});

app.get("/api/file/:job/:name",(req,res)=>{
  const safe=path.basename(req.params.name);
  const file=path.join(WORK,req.params.job,safe);
  if(!fs.existsSync(file)) return res.status(404).end();
  res.download(file);
});

app.get("*",(req,res)=>res.sendFile(path.join(ROOT,"public","index.html")));

app.listen(PORT,()=>console.log(`ClipForge running on port ${PORT}`));