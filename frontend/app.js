const API = 'http://localhost:3000/api';
const itemsTbody = document.querySelector('#itemsTable tbody');
const addItemBtn = document.getElementById('addItemBtn');
const saveOrderBtn = document.getElementById('saveOrderBtn');
const shippingInput = document.getElementById('shippingCost');
const numProductsInput = document.getElementById('numProducts');
const calculatedTotalDiv = document.getElementById('calculatedTotal');
const ordersListDiv = document.getElementById('ordersList');

function createItemRow(productName='', cost=0, sale=0){
  const tr=document.createElement('tr');
  tr.innerHTML=`<td><input class='pname' type='text' value='${productName}'></td>
  <td><input class='cost' type='number' step='0.01' value='${cost}'></td>
  <td><input class='sale' type='number' step='0.01' value='${sale}'></td>
  <td><button class='btn small remove'>Eliminar</button></td>`;
  tr.querySelector('.remove').addEventListener('click',()=>{tr.remove();updateCalculatedTotal();});
  ['cost','sale'].forEach(cls=>{tr.querySelector('.'+cls).addEventListener('input',updateCalculatedTotal);});
  itemsTbody.appendChild(tr);
}
addItemBtn.addEventListener('click',()=>createItemRow());

function getItemsFromTable(){
  return Array.from(itemsTbody.querySelectorAll('tr')).map(r=>({
    product_name:r.querySelector('.pname').value||'Producto',
    cost_price:parseFloat(r.querySelector('.cost').value)||0,
    sale_price:parseFloat(r.querySelector('.sale').value)||0
  }));
}
function updateCalculatedTotal(){
  const items=getItemsFromTable();
  const itemsTotal=items.reduce((s,i)=>s+(i.sale_price||0),0);
  const shipping=parseFloat(shippingInput.value)||0;
  calculatedTotalDiv.textContent=(itemsTotal+shipping).toFixed(2);
  numProductsInput.value=items.length;
}
shippingInput.addEventListener('input',updateCalculatedTotal);
saveOrderBtn.addEventListener('click',async()=>{
  const items=getItemsFromTable();
  if(items.length===0)return alert('Agrega al menos un producto');
  const payload={shipping_cost:parseFloat(shippingInput.value)||0,total:parseFloat(calculatedTotalDiv.textContent)||0,num_products:parseInt(numProductsInput.value)||items.length,items};
  try{
    const res=await fetch(API+'/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data=await res.json();if(!res.ok)throw new Error(data.error||'Error');
    alert('Pedido guardado — ID: '+data.orderId);
    itemsTbody.innerHTML='';createItemRow();shippingInput.value=0;updateCalculatedTotal();fetchOrders();
  }catch(e){alert('Error guardando pedido: '+e.message);}
});
createItemRow();updateCalculatedTotal();

async function fetchOrders(){
  try{
    const res=await fetch(API+'/orders');
    const orders=await res.json();
    if(!Array.isArray(orders))throw new Error('Respuesta inválida');
    renderOrders(orders);
  }catch(e){ordersListDiv.textContent='Error cargando pedidos';}
}
function renderOrders(orders){
  if(orders.length===0){ordersListDiv.innerHTML='<em>No hay pedidos guardados</em>';return;}
  ordersListDiv.innerHTML='';
  orders.forEach(o=>{
    const div=document.createElement('div');div.className='order';
    div.innerHTML=`<div><strong>Pedido #${o.id}</strong> — ${new Date(o.created_at).toLocaleString()}</div>
    <div class='meta'>Productos: ${o.num_products} — Envío: ${o.shipping_cost.toFixed(2)} — Total: ${o.total.toFixed(2)}</div>
    <details><summary>Detalle</summary><ul>${o.items.map(it=>`<li>${it.product_name} — compra: ${it.cost_price.toFixed(2)} — venta: ${it.sale_price.toFixed(2)}</li>`).join('')}</ul></details>`;
    ordersListDiv.appendChild(div);
  });
}
fetchOrders();
