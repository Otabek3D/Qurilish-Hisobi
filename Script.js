// Script.js – To‘liq to‘g‘rilangan versiya (jadval dizayni o‘zgarmaydi)

function initFloatingLabels(container = document) { }
document.addEventListener('DOMContentLoaded', () => initFloatingLabels());

document.querySelectorAll('.block-section').forEach(section => {
  const addBtn = section.querySelector('.add');
  addBtn.onclick = () => {
    const template = section.querySelector('.template');
    if (!template) return;

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

    clone.querySelector('.remove').onclick = () => {
      clone.remove();
      updateDevorOptions();
    };

    initFloatingLabels(clone);
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

function updateDevorOptions() {
  const ids = [...document.querySelectorAll('#devor .d_id')]
    .map(i => i.value.trim())
    .filter(Boolean);

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

// HISOBLASH – TO‘G‘RILANGAN VERSIYA
document.getElementById('hisobla').onclick = () => {
  const tbody = document.querySelector('#natija tbody');
  tbody.innerHTML = '';

  const OHAK = 0.013; // 13 mm

  const addRow = (tur, nomi, olcham, jami) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${tur}</td><td>${nomi}</td><td>${olcham}</td><td>${jami}</td>`;
    tbody.appendChild(tr);
  };

  // 1. Devor ma'lumotlarini yig'ish
  const devorlar = {};
  document.querySelectorAll('#devor .item').forEach(item => {
    const id = item.querySelector('.d_id').value?.trim();
    if (!id) return;

    const uzunlik = parseFloat(item.querySelector('.d_uzunlik').value) || 0;
    const balandlik = parseFloat(item.querySelector('.d_balandlik').value) || 0;
    const qalinlik = parseFloat(item.querySelector('.d_qalinlik').value) || 0;

    const g_uz = parseFloat(item.querySelector('.g_uzunlik').value) / 100 || 0.25;
    const g_ba = parseFloat(item.querySelector('.g_balandlik').value) / 100 || 0.07;
    const g_qa = parseFloat(item.querySelector('.g_qalinlik').value) / 100 || 0.12;

    if (uzunlik && balandlik && qalinlik) {
      devorlar[id] = {
        uzunlik, balandlik, qalinlik,
        g_uz, g_ba, g_qa,
        ochilish_m2: 0,
        olcham_str: `${item.querySelector('.g_uzunlik').value}×${item.querySelector('.g_balandlik').value}×${item.querySelector('.g_qalinlik').value} sm`
      };
    }
  });

  // 2. Eshik va derazalarni o‘z devoridan ayirish
  let total_deraza = 0, total_eshik = 0;

  [...document.querySelectorAll('#deraza .item'), ...document.querySelectorAll('#eshik .item')].forEach(item => {
    const eni = parseFloat(item.querySelector('[class*="eni"]').value) || 0;
    const bal = parseFloat(item.querySelector('[class*="balandlik"]').value) || 0;
    const soni = parseFloat(item.querySelector('[class*="soni"]').value) || 1;
    const devId = item.querySelector('select').value;

    if (eni && bal && devId && devorlar[devId]) {
      const maydon = eni * bal * soni;
      devorlar[devId].ochilish_m2 += maydon;

      if (item.closest('#deraza')) total_deraza += maydon;
      else total_eshik += maydon;
    }
  });

  // 3. G‘isht hisoblash (har devor alohida)
  const gisht_turlari = {}; // "25×7×12 sm" => soni

  Object.values(devorlar).forEach(d => {
    const toza_maydon = d.uzunlik * d.balandlik - d.ochilish_m2;
    if (toza_maydon <= 0) return;

    const hajm = toza_maydon * d.qalinlik;
    const bitta_gisht = (d.g_uz + OHAK) * (d.g_ba + OHAK) * d.g_qa;
    const soni = Math.ceil(hajm / bitta_gisht);

    gisht_turlari[d.olcham_str] = (gisht_turlari[d.olcham_str] || 0) + soni;
  });

  // 4. Beton hisoblash (o‘zgarmadi)
  const beton_by_tur = {};
  document.querySelectorAll('#beton .item').forEach(item => {
    const tur = item.querySelector('.tur').value;
    const uzunlik = parseFloat(item.querySelector('.uzunlik').value) || 0;
    const balandlik = parseFloat(item.querySelector('.balandlik').value) || 0;
    const eni = parseFloat(item.querySelector('.eni').value) || 0;
    const hajm = uzunlik * balandlik * eni;

    const qator = parseFloat(item.querySelector('.armatura_qator').value) || 0;
    const diam = item.querySelector('input[type=radio]:checked')?.value;

    if (!beton_by_tur[tur]) {
      beton_by_tur[tur] = { armatura: {}, sement: 0, shagal: 0, kub: 0 };
    }

    if (diam && qator) {
      beton_by_tur[tur].armatura[diam] = (beton_by_tur[tur].armatura[diam] || 0) + (uzunlik * qator);
    }

    beton_by_tur[tur].sement += hajm * (parseFloat(item.querySelector('.sement').value) || 0);
    beton_by_tur[tur].shagal += hajm * (parseFloat(item.querySelector('.shagal').value) || 0);
    beton_by_tur[tur].kub += hajm;
  });

  // 5. Tom
  let total_tom = 0;
  document.querySelectorAll('#tom .item').forEach(item => {
    const narx = parseFloat(item.querySelector('.tom_narx').value) || 0;
    const maydon = parseFloat(item.querySelector('.tom_maydon').value) || 0;
    total_tom += narx * maydon;
  });

  // NATIJA CHIQARISH (avvalgi dizaynda)
  document.getElementById('natija').style.display = 'table';

  if (total_deraza) addRow('', 'Deraza', 'm²', total_deraza.toFixed(2));
  if (total_eshik) addRow('', 'Eshik', 'm²', total_eshik.toFixed(2));

  Object.entries(gisht_turlari).forEach(([olcham, soni]) => {
    addRow('', 'G‘isht', olcham, soni);
  });

  Object.keys(beton_by_tur).forEach(tur => {
    const d = beton_by_tur[tur];
    if (d.kub) addRow(tur, 'Beton', 'm³', d.kub.toFixed(3));
    Object.keys(d.armatura).forEach(diam => {
      addRow(tur, 'Armatura', diam + ' mm', d.armatura[diam].toFixed(2) + ' m');
    });
    if (d.sement) addRow(tur, 'Sement', 'kg', d.sement.toFixed(1));
    if (d.shagal) addRow(tur, 'Shag‘al', 'kg', d.shagal.toFixed(1));
  });

  if (total_tom) addRow('', 'Tom material', 'so‘m', total_tom.toLocaleString());

  // JAMI
  let jami_beton = 0, jami_sement = 0, jami_shagal = 0;
  const jami_armatura = {};

  Object.values(beton_by_tur).forEach(d => {
    jami_beton += d.kub;
    jami_sement += d.sement;
    jami_shagal += d.shagal;
    Object.entries(d.armatura).forEach(([diam, len]) => {
      jami_armatura[diam] = (jami_armatura[diam] || 0) + len;
    });
  });

  if (jami_beton > 0) addRow('JAMI', 'Beton', 'm³', jami_beton.toFixed(3));
  [12,16,18].forEach(d => {
    if (jami_armatura[d]) addRow('JAMI', 'Armatura', d + ' mm', jami_armatura[d].toFixed(2) + ' m');
  });
  if (jami_sement > 0) addRow('JAMI', 'Sement', 'kg', jami_sement.toFixed(1));
  if (jami_shagal > 0) addRow('JAMI', 'Shag‘al', 'kg', jami_shagal.toFixed(1));
};

// PDF export (o‘zgarmadi)
document.getElementById('exportPDF').onclick = () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Qurilish Hisobi', 14, 20);
  doc.autoTable({
    html: '#natija',
    startY: 30,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [225, 232, 255] }
  });
  doc.save('qurilish_hisobi.pdf');
};