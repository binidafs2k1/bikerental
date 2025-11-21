import React, { useEffect, useRef } from 'react'
import API from '../api'
import Chart from 'chart.js/auto'

export default function Visualization(){
  const canvasRef = useRef(null)
  useEffect(()=>{
    let chart;
    async function load(){
      const res = await API.get('/stats/stations');
      const data = res.data.stations;
      const labels = data.map(d=>d.name);
      const values = data.map(d=>d.available);
      const max = Math.max(...data.map(d=>d.capacity), 1);

      const ctx = canvasRef.current.getContext('2d');
      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{ label: 'Available bikes', data: values, backgroundColor: 'rgb(54,162,235)' }]
        },
        options: { scales: { y: { beginAtZero: true, max } } }
      })
    }
    load()
    return ()=>{ if (chart) chart.destroy() }
  }, [])

  return (
    <div className="card">
      <h3>Station Availability</h3>
      <canvas ref={canvasRef} />
    </div>
  )
}
