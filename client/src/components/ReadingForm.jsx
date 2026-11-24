import React,{useEffect,useState} from 'react';
export const SLOTS=['Morning (fasting)','After breakfast','After lunch','After dinner'];
export const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export default function ReadingForm({initial,onSave,onCancel,loading}) {
 const [date,setDate]=useState(initial?.date||today());
 const [slot,setSlot]=useState(initial?.slot||SLOTS[0]);
 const [value,setValue]=useState(initial?.value?.toString()||'');
 const [error,setError]=useState('');
 useEffect(()=>{setDate(initial?.date||today());setSlot(initial?.slot||SLOTS[0]);setValue(initial?.value?.toString()||'');setError('');},[initial]);
 async function submit(e){e.preventDefault();if(value.trim()===''){setError('Please enter a glucose value.');return;}const number=Number(value);if(!/^\d+$/.test(value)||!Number.isInteger(number)||number<40||number>600){setError('Value must be a whole number between 40 and 600 mg/dl.');return;}if(date>today()){setError('Date cannot be in the future.');return;}setError('');await onSave({date,slot,value:number});}
 return <form onSubmit={submit} className="reading-form"><div className="form-grid"><label>Date<input type="date" required max={today()} value={date} onChange={e=>setDate(e.target.value)}/></label><label>Time slot<select value={slot} onChange={e=>setSlot(e.target.value)}>{SLOTS.map(s=><option key={s}>{s}</option>)}</select></label><label>Glucose (mg/dl)<input type="number" min="40" max="600" step="1" placeholder="e.g. 110" value={value} onChange={e=>setValue(e.target.value)}/></label></div>{error&&<p role="alert" className="error">{error}</p>}<div className="actions"><button className="primary" disabled={loading}>{loading?'Saving...':initial?'Save changes':'Add reading'}</button>{onCancel&&<button type="button" className="ghost" onClick={onCancel}>Cancel</button>}</div></form>;
}
