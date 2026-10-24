import { spawn } from 'node:child_process';
export function runProcess(command,args,{cwd,signal,input,env,timeout=120000,maxOutput=2*1024*1024}={}) {
  return new Promise((resolve,reject)=>{
    const child=spawn(command,args,{cwd,env:env??process.env,signal,stdio:['pipe','pipe','pipe']});
    let output='',error='',settled=false;
    const timer=setTimeout(()=>{child.kill('SIGKILL');finish(new Error('Process timed out'));},timeout);
    function finish(err){if(settled)return;settled=true;clearTimeout(timer);if(err)reject(err);else resolve(output);}
    child.stdout.on('data',chunk=>{output+=chunk;if(output.length>maxOutput){child.kill('SIGKILL');finish(new Error('Process output limit exceeded'));}});
    child.stderr.on('data',chunk=>{error=(error+chunk).slice(-4000);});
    child.once('error',finish);
    child.once('close',code=>finish(code===0?null:new Error(`Process failed (${code}): ${error.slice(-600)}`)));
    child.stdin.on('error',()=>{});child.stdin.end(input??'');
  });
}
