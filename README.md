# Teacher's Hub ITQSHHB

## Akses warga pendidik

Laman utama memerlukan akaun e-mel `@itqshhb.edu.bn` yang sudah disahkan. Pengguna mendaftar di [halaman akaun](https://teachershub-itq.web.app/auth.html) dengan nama, nombor telefon, e-mel rasmi dan kata laluan. Firebase menghantar pautan pengesahan sebelum akses penuh dibuka.

Portal warga pendidik ITQSHHB di [teachershub-itq.web.app](https://teachershub-itq.web.app/). Pautan laporan pelajar membuka sistem borang sedia ada. Portal ini tidak menyimpan laporan atau data pelajar.

## Urus kandungan

Buka [ruang Admin](https://teachershub-itq.web.app/admin.html), log masuk dengan akaun Google `azharsuhaili19@gmail.com`, dan urus **Tarikh penting** atau **Makluman warga pendidik**. Tekan **Simpan perubahan** untuk menerbitkan kandungan tanpa mengubah kod atau membuat deploy. Muat semula laman utama untuk melihat perubahan.

Entri boleh ditambah, diubah, dinyahaktifkan atau dibuang. Tarikh penting yang berlalu disembunyikan pada laman utama. Makluman boleh diberi tarikh tamat dan pautan HTTPS. Semua kandungan dalam editor ialah kandungan awam; jangan masukkan nama pelajar atau maklumat sulit.

Kandungan disimpan di Cloud Firestore, database `teachers-hub-content` (Singapore). Dokumen `siteContent/current` boleh dibaca umum. Firestore Security Rules hanya membenarkan akaun Google admin yang telah disahkan mengubahnya. Sebelum simpanan pertama atau apabila Firestore tidak tersedia, laman utama menggunakan kandungan sandaran dalam `config.js`.

## Konfigurasi pautan

Pautan borang disiplin, hafazan, akademik dan aktiviti, kalendar, serta laman BPP masih dikonfigurasi dalam `config.js`. Bahagian ini belum berada dalam editor admin. Pautan kosong dipaparkan sebagai **Pautan Belum Tersedia**.

Soalan lazim dikendalikan oleh `faq.js`. Pilihan status perkhidmatan juga dalam `config.js`.

## Pembangunan dan deploy

Jalankan `npm ci` dan `npm run build` untuk membina bundel Firebase dalam `assets/`. GitHub Actions menjalankan langkah ini sebelum setiap deploy Firebase Hosting apabila `main` berubah. Firebase Hosting dan rules dikonfigurasi dalam `firebase.json` dan `firestore.rules`.

Untuk melihat portal secara setempat, jalankan pelayan statik daripada akar repo. Auth Google dan Firestore memerlukan domain yang dibenarkan dalam Firebase Authentication; `localhost` dibenarkan untuk pembangunan.

## Pemasangan

Portal mempunyai web app manifest dan service worker. Laman dan aset penting disimpan untuk paparan ketika sambungan terputus; kandungan Firestore serta penghantaran borang memerlukan Internet.
