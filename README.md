# ITQSHHB Teacher's Hub — Fasa 1

Portal statik, mesra mudah alih untuk pautan perkhidmatan warga pendidik. Tiada pangkalan data, maklumat pelajar, keputusan disiplin atau pengiraan markah dalam fasa ini.

## Struktur produk

- **Laporan Kes Disiplin** — laporan salah laku pelajar untuk perhatian dan tindakan Hal Ehwal Pelajar.
- **Kemajuan Hafazan Al-Quran** — laporan perkembangan hafazan, bacaan atau perkara berkaitan Al-Quran seseorang pelajar.
- **Kemajuan Akademik** — laporan perkembangan, pencapaian atau keperluan sokongan akademik seseorang pelajar.
- **Laporan Aktiviti Pelajar** — borang laporan terperinci untuk diisi oleh Ketua Bahagian (HOD) atau penganjur aktiviti.
- **Kalendar Aktiviti** — pautan kepada kalendar Institut.
- **Bahagian Pembangunan Pelajar** — laman rasmi BPP.

Semua perkhidmatan berada pada satu halaman utama. Pautan kosong dipaparkan sebagai **Pautan Belum Tersedia** tanpa butang yang rosak.

Pautan laporan disiplin, hafazan, akademik, aktiviti pelajar dan kalendar aktiviti menggunakan URL yang diberikan.

## Gantikan URL borang

Edit `config.js` untuk mengemas kini pautan `disiplin`, `hafazan`, `akademik`, `aktiviti` atau `kalendar`. Pautan BPP juga dikonfigurasi di sana. Pautan yang kosong dipaparkan sebagai **Pautan Belum Tersedia** tanpa butang yang rosak.

Contoh:

```js
links: {
  disiplin: "https://docs.google.com/forms/d/e/FORM_ID/viewform",
  hafazan: "https://docs.google.com/forms/d/e/FORM_ID/viewform",
  akademik: "https://docs.google.com/forms/d/e/FORM_ID/viewform",
  aktiviti: "https://docs.google.com/forms/d/e/FORM_ID/viewform",
  kalendar: "https://script.google.com/macros/s/DEPLOYMENT_ID/exec",
  bpp: "https://hep-itqshhb.github.io/bpp-itq/"
}
```

## Tarikh, pengumuman dan status pautan

Kandungan operasi disimpan dalam `config.js`:

- `importantDates` memaparkan tarikh akan datang dan menyembunyikan tarikh yang sudah mansuh secara automatik.
- `announcements` memaparkan makluman aktif; gunakan `expiresAt` untuk menyembunyikan makluman selepas tarikh tertentu.
- `serviceStatus` menerima status `active`, `maintenance` atau `closed` bagi setiap perkhidmatan.

Untuk mengurus kandungan melalui Google Sheet, cipta helaian dengan lajur `type,title,date,summary,link,status,expiresAt`, pilih **File > Share > Publish to web > CSV**, kemudian masukkan URL CSV tersebut pada `contentFeedUrl`. Gunakan `date` untuk tarikh penting dan `announcement` untuk pengumuman pada lajur `type`. Jangan terbitkan nama pelajar, laporan atau maklumat sulit melalui helaian awam ini.

## Pemasangan pada telefon

Teacher's Hub dilengkapi web app manifest dan service worker. Pelayar yang menyokong pemasangan akan memaparkan butang **Pasang**. Halaman utama dan aset penting boleh dibuka semula apabila sambungan terganggu; penghantaran borang masih memerlukan Internet.

## Firebase Hosting

Laman produksi menggunakan `https://teachershub-itq.web.app`. Konfigurasi Firebase turut menetapkan security headers, dasar sumber kandungan dan cache aset statik.

## Imej hero

Imej hero yang dibekalkan disimpan sebagai `hero-itqshhb.webp` dalam format termampat supaya keseluruhan menara jelas kelihatan dan masa muat turun lebih singkat. Teks hero dipaparkan di bawah imej dan tidak dicetak pada imej.ntuk memendekkan masa muat turun. Teks hero dipaparkan di bawah imej dan tidak dicetak pada imej.

## Logo

Logo ITQSHHB yang dibekalkan disimpan pada `logo-itqshhb.png`. Untuk menggantikannya, letakkan fail logo rasmi yang diluluskan di lokasi sama dengan nama yang sama. Jangan gunakan logo rekaan atau tiruan.

## Uji secara setempat

Buka `index.html` dalam pelayar, atau jalankan pelayan statik daripada folder ini. Semak paparan pada lebar 320 px, telefon, tablet dan desktop; tab fokus papan kekunci; pautan kosong; pautan BPP; dan pautan HTTPS yang telah dikonfigurasi.

## Persediaan GitHub Pages

Portal ini statik dan tidak memerlukan pangkalan data atau build step. Untuk penerbitan yang benar-benar berasingan daripada BPP, gunakan repositori Teacher's Hub khusus, aktifkan Pages daripada branch `main` dan folder root, kemudian semak URL Pages yang diberikan GitHub.

### Konfigurasi penting sebelum pelancaran

1. Pastikan URL borang dan kalendar masih aktif.
2. Gunakan repositori Teacher's Hub yang berasingan daripada laman BPP.

Tiada credential diperlukan untuk laman statik ini. Google Forms dan kalendar mengurus akses serta data di sistem masing-masing. Jika kawalan akses warga sekolah diwajibkan, gunakan penyelesaian Google Workspace yang disahkan dan jangan menganggap pautan tersembunyi atau kod pelayar sebagai kawalan keselamatan.

## Palet warna

Tema visual laman menggunakan warna daripada template yang dibekalkan: Calypso (#2B6077) sebagai warna utama, Tower Gray (#B0C0C6) untuk neutral, Shadow (#787046) sebagai aksen, dan Verdigris (#534E32) sebagai sokongan tona gelap.

## Soalan Lazim

Bahagian Soalan Lazim dan fungsi carian, penapis kategori serta paparan proses laporan dikendalikan oleh `faq.js`. Kandungan FAQ boleh dikemas kini dalam senarai data pada fail tersebut.

