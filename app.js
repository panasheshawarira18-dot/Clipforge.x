const $=s=>document.querySelector(s);
let job=null;

document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active")); b.classList.add("active");
  $("#youtubePanel").classList.toggle("hidden",b.dataset.tab!=="youtube");
  $("#uploadPanel").classList.toggle("hidden",b.dataset.tab!=="upload");
});

function status(t){$("#status").textContent=t}

$("#load").onclick=async()=>{
  const url=$("#url").value.trim();
  if(!url)return status("Paste a YouTube URL first.");
  status("Fetching video… this can take a while for long videos.");
  try{
    const r=await fetch("/api/youtube",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url})});
    const d=await r.json(); if(!r.ok)throw Error(d.error);
    job=d.job; $("#settings").classList.remove("hidden"); status("Video ready. Choose your clip settings.");
  }catch(e){status(e.message)}
};

$("#file").onchange=async()=>{
  const f=$("#file").files[0]; if(!f)return;
  status("Uploading video…");
  const fd=new FormData(); fd.append("video",f);
  try{
    const r=await fetch("/api/upload",{method:"POST",body:fd});
    const d=await r.json(); if(!r.ok)throw Error(d.error);
    job=d.job; $("#settings").classList.remove("hidden"); status("Upload complete. Choose your clip settings.");
  }catch(e){status(e.message)}
};

$("#generate").onclick=async()=>{
  if(!job)return;
  const payload={job,clipLength:Number($("#length").value),count:Number($("#count").value),start:Number($("#start").value),vertical:$("#vertical").checked};
  status("Creating clips with FFmpeg…");
  $("#generate").disabled=true;
  try{
    const r=await fetch("/api/cut",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const d=await r.json(); if(!r.ok)throw Error(d.error);
    $("#results").classList.remove("hidden");
    $("#clipGrid").innerHTML=d.clips.map((u,i)=>`<div class="clip"><b>Clip ${i+1}</b><a href="${u}">Download MP4</a></div>`).join("");
    status(`Done — ${d.clips.length} clips created.`);
    $("#results").scrollIntoView({behavior:"smooth"});
  }catch(e){status(e.message)}
  finally{$("#generate").disabled=false}
};