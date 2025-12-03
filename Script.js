// Floating labels
function initFloatingLabels(container = document) {
  container.querySelectorAll('.input-group input, .input-group select').forEach(input => {
    const label = input.nextElementSibling;
    if (!label || label.tagName !== 'LABEL') return;

    const update = () => {
      if (input.value || input.matches(':focus')) label.classList.add('active');
      else label.classList.remove('active');
    };
    input.addEventListener('input', update);
    input.addEventListener('focus', update);
    input.addEventListener('blur', update);
    if (input.tagName === 'SELECT') input.addEventListener('change', update);
    update();
  });
}
document.addEventListener('DOMContentLoaded', () => initFloatingLabels());

// Qo‘shish / o‘chirish
document.querySelectorAll('.block-section').forEach(section => {
  const addBtn = section.querySelector('.add');
  addBtn.onclick = () => {
    const template = section.querySelector('.template');
    const clone = template.cloneNode(true);
    clone.classList.remove('template');
    clone.classList.add('item');
    clone.querySelectorAll('input, select').forEach(el => {
      if (el.type === 'radio') el.checked = false;
      else el.value = '';
    });
    if (section.id === 'beton') {
      const name = 'arm_' + Date.now();
      clone.querySelectorAll('input[type=radio]').forEach(r => r.name = name);
    }
    initFloatingLabels(clone);
    clone.querySelector('.remove').onclick = () => { clone.remove(); updateDevorOptions(); };
    section.insertBefore(clone, addBtn);
    updateDevorOptions();
  };

  section.querySelectorAll('.remove').forEach(btn => {
    btn.onclick = () => {
      if (section.querySelectorAll('.item').length > 1) {
        btn.closest('.item').remove();
        updateDevorOptions();
      }
    };
  });
});

// Devor ID selectlarni yangilash
function updateDevorOptions() {
  const ids = [...document.querySelectorAll('#devor .d_id')].map(i => i.value).filter(Boolean);
  document.querySelectorAll('.dr_dev_id, .e_dev_id').forEach(sel => {
    const cur = sel.value;
    sel.innerHTML = '<option value="">Devor ID tanlang</option>';
    ids.forEach(id => sel.add(new Option(id, id)));
    sel.value = ids.includes(cur) ? cur : '';
  });
}
document.addEventListener('input', e => {
  if (e.target.classList.contains('d_id')) updateDevorOptions();
});

// HISOBLASH – ohak 1.3 sm (13 mm)
document.getElementById('hisobla').onclick = () => {
  const tbody = document.querySelector('#natija tbody');
  tbody.innerHTML = '';
  let total_gisht = 0, gisht_olcham = '', total_deraza = 0, total_eshik = 0, total_tom = 0;
  const beton_by_tur = {};

  const OHAK = 0.013; // 1.3 sm ohak uzunlik va balandlikka

  // Devor ma'lumotlari
  const devorlar = {};
  document.querySelectorAll('#devor .item').forEach(item => {
    const id = item.querySelector('.d_id').value?.trim();
    const qalinlik = parseFloat(item.querySelector('.d_qalinlik').value) || 0;
    const guz = parseFloat(item.querySelector('.g_uzunlik').value) / 100 || 0;
    const gba = parseFloat(item.querySelector('.g_balandlik').value) / 100 || 0;
    const gqa = parseFloat(item.querySelector('.g_qalinlik').value) / 100 || 0;
    if (id && guz && gba && gqa) {
      devorlar[id] = { qalinlik, guz, gba, gqa };
      gisht_olcham = `${item.querySelector('.g_uzunlik').value}×${item.querySelector('.g_balandlik').value}×${item.querySelector('.g_qalinlik').value} sm`;
    }
  });

  // Deraza va eshik ayirish
  [...document.querySelectorAll('#deraza .item'), ...document.querySelectorAll('#eshik .item')].forEach(item => {
    const eni = parseFloat(item.querySelector('[class*="eni"]').value) || 0;
    const bal = parseFloat(item.querySelector('[class*="balandlik"]').value) || 0;
    const soni = parseFloat(item.querySelector('[class*="soni"]').value) || 1;
    const devId = item.querySelector('select').value;
    if (eni && bal && devId && devorlar[devId]) {
      const d = devorlar[devId];
      const hajm = eni * bal * d.qalinlik * soni;
      const gisht_hajm = (d.guz + OHAK) * (d.gba + OHAK) * d.gqa;
      total_gisht -= Math.ceil(hajm / gisht_hajm);
      if (item.closest('#deraza')) total_deraza += eni * bal * soni;
      else total_eshik += eni * bal * soni;
    }
  });

  // Devor g‘ishtlari hisoblash
  document.querySelectorAll('#devor .item').forEach(item => {
    const uz = parseFloat(item.querySelector('.d_uzunlik').value) || 0;
    const ba = parseFloat(item.querySelector('.d_balandlik').value) || 0;
    const qa = parseFloat(item.querySelector('.d_qalinlik').value) || 0;
    const guz = parseFloat(item.querySelector('.g_uzunlik').value) / 100 || 0;
    const gba = parseFloat(item.querySelector('.g_balandlik').value) / 100 || 0;
    const gqa = parseFloat(item.querySelector('.g_qalinlik').value) / 100 || 0;

    if (uz && ba && qa && guz && gba && gqa) {
      const dev_hajm = uz * ba * qa;
      const gisht_hajm = (guz + OHAK) * (gba + OHAK) * gqa;
      total_gisht += Math.ceil(dev_hajm / gisht_hajm);
    }
  });

  // Beton hisoblash
  document.querySelectorAll('#beton .item').forEach(item => {
    const tur = item.querySelector('.tur').value;
    const hajm = (parseFloat(item.querySelector('.uzunlik').value)||0) *
                (parseFloat(item.querySelector('.balandlik').value)||0) *
                (parseFloat(item.querySelector('.eni').value)||0);
    const qator = parseFloat(item.querySelector('.armatura_qator').value)||0;
    const diam = item.querySelector('input[type=radio]:checked')?.value;

    if (!beton_by_tur[tur]) beton_by_tur[tur] = {armatura:{},sement:0,shagal:0};
    if (diam && qator) {
      beton_by_tur[tur].armatura[diam] = (beton_by_tur[tur].armatura[diam]||0) + (parseFloat(item.querySelector('.uzunlik').value)||0)*qator;
    }
    beton_by_tur[tur].sement += hajm * (parseFloat(item.querySelector('.sement').value)||0);
    beton_by_tur[tur].shagal += hajm * (parseFloat(item.querySelector('.shagal').value)||0);
  });

  // Tom
  document.querySelectorAll('#tom .item').forEach(item => {
    const narx = parseFloat(item.querySelector('.tom_narx').value)||0;
    const maydon = parseFloat(item.querySelector('.tom_maydon').value)||0;
    total_tom += narx * maydon;
  });

  // Natija chiqarish
  const addRow = (tur, nomi, olcham, jami) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${tur}</td><td>${nomi}</td><td>${olcham}</td><td>${jami}</td>`;
    tbody.appendChild(tr);
  };

  document.getElementById('natija').style.display = 'table';
  if (total_deraza) addRow('', 'Deraza', 'm²', total_deraza.toFixed(2));
  if (total_eshik) addRow('', 'Eshik', 'm²', total_eshik.toFixed(2));
  if (total_gisht) addRow('', 'G‘isht', gisht_olcham, total_gisht);

  Object.keys(beton_by_tur).forEach(tur => {
    const d = beton_by_tur[tur];
    Object.keys(d.armatura).forEach(diam => addRow(tur, 'Armatura', diam+' mm', d.armatura[diam].toFixed(2)+' m'));
    if (d.sement) addRow(tur, 'Sement', 'kg', d.sement.toFixed(1));
    if (d.shagal) addRow(tur, 'Shag‘al', 'kg', d.shagal.toFixed(1));
  });
  if (total_tom) addRow('', 'Tom material', 'so‘m', total_tom.toLocaleString());
};

// PDF export
document.getElementById('exportPDF').onclick = () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Qurilish Hisobi', 14, 20);
  let y = 35;
  document.querySelectorAll('#natija tbody tr').forEach(tr => {
    const cells = tr.querySelectorAll('td');
    const text = `${cells[0].textContent ? cells[0].textContent+': ' : ''}${cells[1].textContent}: ${cells[3].textContent} ${cells[2].textContent}`;
    doc.setFontSize(12);
    doc.text(text, 14, y);
    y += 10;
  });
  doc.save('qurilish_hisobi.pdf');
};