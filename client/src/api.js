const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export async function api(path,{method='GET',body,token}={}) {
  let response;
  try { response = await fetch(BASE+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})}); }
  catch { throw new Error('Cannot reach server. Check that the API is running.'); }
  if(response.status===204) return null;
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}
