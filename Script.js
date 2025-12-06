// Script.js – 100% to‘liq yangilangan versiya (Peremychka + Sesma yuzasi bilan)
document.addEventListener('DOMContentLoaded', () => {

  // Qo‘shish va o‘chirish tugmalari
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
        else if (el.type === 'checkbox') el.checked = false;
        else el.value = '';
      });

      if (section.id === 'beton') {
        const name = 'arm_' + Date.now();
        clone.querySelectorAll('input[type=radio]').forEach(r => r.name = name);
      }

const removeBtn = clone.querySelector('.remove');
removeBtn.style.display = ''; // yangi itemda remove tugmasi ko‘rinadi
removeBtn.onclick = () => {
  if (section.querySelectorAll('.item').length > 1) {
    clone.remove();
    updateDevorOptions();
  }
};


      section.insertBefore(clone, addBtn);
      updateDevorOptions();
    };

    // Template dagi remove ni yashirish
    section.querySelectorAll('.item.template .remove').forEach(btn => btn.style.display = 'none');
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

  // Beton tur o‘zgarganda label o‘zgartirish
  document.querySelector('#beton').addEventListener('change', e => {
    if (e.target.classList.contains('tur')) {
      const item = e.target.closest('.item');
      const balLabel = item.querySelector('.balandlik + label');
      if (balLabel) {
        balLabel.textContent = (e.target.value === 'Kolonna') ? 'Kenglik (m)' : 'Balandlik (m)';
      }
    }
  });

    // PEREMYCHKA UCHUN UZUNLIK VA ENI NI YOZIB BO‘LMAYDIGAN QILISH
  document.querySelector('#beton').addEventListener('change', e => {
    if (e.target.classList.contains('tur')) {
      const item = e.target.closest('.item');
      const uzunlikInp = item.querySelector('.uzunlik');
      const eniInp = item.querySelector('.eni');

      if (e.target.value === 'Peremychka') {
        uzunlikInp.readOnly = true;
        eniInp.readOnly = true;
        uzunlikInp.style.backgroundColor = '#f0f0f0';
        eniInp.style.backgroundColor = '#f0f0f0';
        uzunlikInp.value = 'Avto hisoblanadi';
        eniInp.value = 'Devor qalinligi';
      } else {
        uzunlikInp.readOnly = false;
        eniInp.readOnly = false;
        uzunlikInp.style.backgroundColor = '';
        eniInp.style.backgroundColor = '';
        uzunlikInp.value = '';
        eniInp.value = '';
      }
    }
  });

  // ======================== HISOBLASH ========================
  document.getElementById('hisobla').onclick = () => {
    const tbody = document.querySelector('#natija tbody');
    tbody.innerHTML = '';
    document.getElementById('natija').style.display = 'none';

    const OHAK = 0.013; // 13 mm ohak

    const addRow = (tur, nomi, olcham, jami) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${tur}</td><td>${nomi}</td><td>${olcham}</td><td>${jami}</td>`;
      tbody.appendChild(tr);
    };

    // 1. Devorlarni yig‘ish
    const devorlar = {};
    document.querySelectorAll('#devor .item').forEach(item => {
      const id = item.querySelector('.d_id').value?.trim();
      if (!id) return;

      const uzunlik = parseFloat(item.querySelector('.d_uzunlik').value) || 0;
      const balandlik = parseFloat(item.querySelector('.d_balandlik').value) || 0;
      const qalinlik = parseFloat(item.querySelector('.d_qalinlik').value) || 0;
      const half = item.querySelector('.d_half').checked;

      const g_uz = parseFloat(item.querySelector('.g_uzunlik').value) / 100 || 0.25;
      const g_ba = parseFloat(item.querySelector('.g_balandlik').value) / 100 || 0.07;
      const g_qa = parseFloat(item.querySelector('.g_qalinlik').value) / 100 || 0.12;

      if (uzunlik > 0 && balandlik > 0 && qalinlik > 0) {
        devorlar[id] = {
          uzunlik, balandlik, qalinlik, half,
          g_uz, g_ba, g_qa,
          ochilish_m2: 0,
          return_m2: 0,
          olcham_str: `${item.querySelector('.g_uzunlik').value}×${item.querySelector('.g_balandlik').value}×${item.querySelector('.g_qalinlik').value} sm`
        };
      }
    });

    // 2. Deraza va eshiklarni yig‘ish + peremychka uchun ma'lumot
    const ochilishlar = []; // { eni, devId, devor_qalinligi }
    let total_deraza = 0, total_eshik = 0;

    [...document.querySelectorAll('#deraza .item'), ...document.querySelectorAll('#eshik .item')].forEach(item => {
      const eni = parseFloat(item.querySelector('[class*="eni"]').value) || 0;
      const bal = parseFloat(item.querySelector('[class*="balandlik"]').value) || 0;
      const soni = Math.max(1, parseInt(item.querySelector('[class*="soni"]').value) || 1);
      const devId = item.querySelector('select').value;

      if (eni > 0 && bal > 0 && devId && devorlar[devId]) {
        const maydon = eni * bal * soni;
        devorlar[devId].ochilish_m2 += maydon;

        const return_m2 = ((bal * devorlar[devId].qalinlik) * 2 + (eni * devorlar[devId].qalinlik) * 2) * soni;
        devorlar[devId].return_m2 += return_m2;

        // Peremychka uchun saqlaymiz
        for (let i = 0; i < soni; i++) {
          ochilishlar.push({
            eni: eni,
            devId: devId,
            qalinlik: devorlar[devId].qalinlik
          });
        }

        if (item.closest('#deraza')) total_deraza += maydon;
        else total_eshik += maydon;
      }
    });

    // 3. G‘isht hisoblash
    const gisht_turlari = {};
    Object.values(devorlar).forEach(d => {
      const toza_maydon = d.uzunlik * d.balandlik - d.ochilish_m2;
      if (toza_maydon <= 0) return;
      const hajm = toza_maydon * d.qalinlik;
      const bitta_gisht_hajm = (d.g_uz + OHAK) * (d.g_ba + OHAK) * d.g_qa;
      const soni = Math.ceil(hajm / bitta_gisht_hajm);
      gisht_turlari[d.olcham_str] = (gisht_turlari[d.olcham_str] || 0) + soni;
    });

    // 4. Beton hisoblash (Peremychka maxsus!)
    const beton_by_tur = {};

    document.querySelectorAll('#beton .item').forEach(item => {
      const tur = item.querySelector('.tur').value;

      // PEREMYCHKA – maxsus logika
      if (tur === 'Peremychka') {
        const balandlik = parseFloat(item.querySelector('.balandlik').value) || 0;
        if (balandlik <= 0 || ochilishlar.length === 0) return;

        if (!beton_by_tur[tur]) {
          beton_by_tur[tur] = { uzunlik: 0, kub: 0, armatura: {}, sement: 0, shagal: 0 };
        }

        ochilishlar.forEach(o => {
          const per_uzunlik = o.eni + 0.4; // +40 sm (har tomondan 20 sm)
          const hajm = per_uzunlik * balandlik * o.qalinlik;

          beton_by_tur[tur].uzunlik += per_uzunlik;
          beton_by_tur[tur].kub += hajm;

          const qator = parseFloat(item.querySelector('.armatura_qator').value) || 0;
          const diam = item.querySelector('input[type=radio]:checked')?.value;
          if (diam && qator > 0) {
            beton_by_tur[tur].armatura[diam] = (beton_by_tur[tur].armatura[diam] || 0) + (per_uzunlik * qator);
          }

          const sement_kg = parseFloat(item.querySelector('.sement').value) || 0;
          const shagal_m3 = parseFloat(item.querySelector('.shagal').value) || 0;
          beton_by_tur[tur].sement += hajm * sement_kg;
          beton_by_tur[tur].shagal += hajm * shagal_m3;
        });
        return;
      }

      // Boshqa turlar: Podushka, Lenta, Kolonna, Sesma
      const uzunlik = parseFloat(item.querySelector('.uzunlik').value) || 0;
      const balandlik = parseFloat(item.querySelector('.balandlik').value) || 0;
      const eni = parseFloat(item.querySelector('.eni').value) || 0;
      const hajm = uzunlik * balandlik * eni;
      if (hajm <= 0) return;

      if (!beton_by_tur[tur]) {
        beton_by_tur[tur] = { uzunlik: 0, kub: 0, armatura: {}, sement: 0, shagal: 0 };
      }

      if (uzunlik > 0) beton_by_tur[tur].uzunlik += uzunlik;

      const qator = parseFloat(item.querySelector('.armatura_qator').value) || 0;
      const diam = item.querySelector('input[type=radio]:checked')?.value;
      if (diam && qator > 0 && uzunlik > 0) {
        beton_by_tur[tur].armatura[diam] = (beton_by_tur[tur].armatura[diam] || 0) + (uzunlik * qator);
      }

      const sement_kg = parseFloat(item.querySelector('.sement').value) || 0;
      const shagal_m3 = parseFloat(item.querySelector('.shagal').value) || 0;
      beton_by_tur[tur].sement += hajm * sement_kg;
      beton_by_tur[tur].shagal += hajm * shagal_m3;
      beton_by_tur[tur].kub += hajm;
    });

    // ===================== NATIJA JADVALGA CHIQARISH =====================
    document.getElementById('natija').style.display = 'table';

    if (total_deraza > 0) addRow('', 'Deraza maydoni', 'm²', total_deraza.toFixed(2));
    if (total_eshik > 0) addRow('', 'Eshik maydoni', 'm²', total_eshik.toFixed(2));

    Object.entries(gisht_turlari).forEach(([olcham, soni]) => {
      addRow('', 'G‘isht', olcham, soni.toLocaleString('ru'));
    });

    // Beton natijalari
    Object.keys(beton_by_tur).forEach(tur => {
      const d = beton_by_tur[tur];
      if (d.uzunlik > 0) addRow(tur, 'Umumiy uzunlik', 'm', d.uzunlik.toFixed(2));
      if (d.kub > 0) addRow(tur, 'Beton hajmi', 'm³', d.kub.toFixed(3));
      Object.keys(d.armatura).forEach(diam => {
        addRow(tur, 'Armatura', `${diam} mm`, d.armatura[diam].toFixed(2) + ' m');
      });
      if (d.sement > 0) addRow(tur, 'Sement', 'kg', Math.round(d.sement));
      if (d.shagal > 0) addRow(tur, 'Shag‘al', 'm³', d.shagal.toFixed(3));
    });

    // SESMA yuzasini devor yuzasiga qo‘shish (alohida chiqmaydi)
    let sesma_qosh_yuza = 0;
    document.querySelectorAll('#beton .item').forEach(item => {
      if (item.querySelector('.tur').value === 'Sesma') {
        const l = parseFloat(item.querySelector('.uzunlik').value) || 0;
        const h = parseFloat(item.querySelector('.balandlik').value) || 0;
        if (l > 0 && h > 0) sesma_qosh_yuza += l * h * 2; // tashqi + ichki
      }
    });

    // Devor yuzasi hisoblash
    let jami_devor = sesma_qosh_yuza;

    Object.entries(devorlar).forEach(([id, d]) => {
      const fasad = d.uzunlik * d.balandlik - d.ochilish_m2;
      const yuzasi = d.half ? fasad + d.return_m2 : (fasad * 2) + d.return_m2;
      if (yuzasi > 0) {
        addRow(id, 'Devor yuzasi', 'm²', yuzasi.toFixed(2));
        jami_devor += yuzasi;
      }
    });

    if (jami_devor > 0) {
      addRow('JAMI', 'Umumiy devor yuzasi (sesma bilan)', 'm²', jami_devor.toFixed(2));
    }

    // JAMI materiallar
    let jami_beton = 0, jami_sement = 0, jami_shagal = 0;
    const jami_arm = {};
    Object.values(beton_by_tur).forEach(d => {
      jami_beton += d.kub;
      jami_sement += d.sement;
      jami_shagal += d.shagal;
      Object.entries(d.armatura).forEach(([diam, len]) => {
        jami_arm[diam] = (jami_arm[diam] || 0) + len;
      });
    });

    if (jami_beton > 0) addRow('JAMI', 'Beton', 'm³', jami_beton.toFixed(3));
    [12,16,18].forEach(d => {
      if (jami_arm[d]) addRow('JAMI', 'Armatura', d + ' mm', jami_arm[d].toFixed(2) + ' m');
    });
    if (jami_sement > 0) addRow('JAMI', 'Sement', 'kg', Math.round(jami_sement));
    if (jami_shagal > 0) addRow('JAMI', 'Shag‘al', 'm³', jami_shagal.toFixed(3));
  };

  // ===================== PDF EXPORT =====================
  document.getElementById('exportPDF').onclick = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFontSize(18);
    doc.text('QURILISH HISOBI', 105, 20, null, null, 'center');

    doc.autoTable({
      html: '#natija',
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3, font: "helvetica" },
      headStyles: { fillColor: [46, 112, 235], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 249, 255] },
    });

    doc.save('qurilish_hisobi.pdf');
  };

});