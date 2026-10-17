# Teacher's Hub ITQSHHB

## Akses warga pendidik

Laman utama memerlukan akaun e-mel `@itqshhb.edu.bn` yang sudah disahkan. Pengguna mendaftar di [halaman akaun](https://teachershub-itq.web.app/auth.html) dengan nama, nombor telefon, e-mel rasmi dan kata laluan. Firebase menghantar pautan pengesahan sebelum akses penuh dibuka.

Portal warga pendidik ITQSHHB di [teachershub-itq.web.app](https://teachershub-itq.web.app/). Pautan laporan pelajar membuka sistem borang sedia ada. Portal ini tidak menyimpan laporan atau data pelajar.

## Urus kandungan

Buka [ruang Admin](https://teachershub-itq.web.app/admin.html) dan log masuk dengan akaun Google `azharsuhaili19@gmail.com`. Dashboard memaparkan jumlah klik setiap pautan Akses Pantas, pautan teratas, jumlah pautan aktif dan kandungan aktif. Statistik klik bermula selepas ciri ini diterbitkan; angka ialah klik, bukan pengguna unik.

Di bahagian **Urus Akses Pantas**, ubah URL HTTPS, status dan nota bagi enam pautan, kemudian tekan **Simpan pautan**. Urus **Tarikh penting** dan **Makluman warga pendidik** dalam bahagian masing-masing, kemudian tekan **Simpan perubahan**. Muat semula laman utama untuk melihat perubahan.

Entri boleh ditambah, diubah, dinyahaktifkan atau dibuang. Tarikh penting yang berlalu disembunyikan pada laman utama. Makluman boleh diberi tarikh tamat dan pautan HTTPS. Jangan masukkan nama pelajar atau maklumat sulit dalam kandungan portal.

Kandungan disimpan di Cloud Firestore, database `teachers-hub-content` (Singapore). Dokumen `siteContent/current` dan `quickLinks/current` boleh dibaca oleh guru yang telah mengesahkan e-mel ITQSHHB; hanya akaun Google admin yang telah disahkan boleh mengubahnya. Statistik agregat disimpan dalam `linkStats/{serviceId}` dan hanya admin boleh membacanya. Tiada identiti pengguna disimpan bersama klik. Sebelum simpanan pertama atau apabila Firestore tidak tersedia, laman utama menggunakan kandungan dan pautan sandaran dalam `config.js`.

## Konfigurasi pautan

Pautan borang disiplin, hafazan, akademik dan aktiviti, kalendar, serta laman BPP boleh diubah dalam Ruang Admin. Nilai dalam `config.js` menjadi sandaran apabila tetapan Firestore belum ada atau tidak dapat dimuatkan. Pautan kosong dipaparkan sebagai **Pautan Belum Tersedia**.

Soalan lazim dikendalikan oleh `faq.js`. Pilihan status perkhidmatan juga dalam `config.js`.

## Pembangunan dan deploy

Jalankan `npm ci` dan `npm run build` untuk membina bundel Firebase dalam `assets/`. GitHub Actions menjalankan langkah ini sebelum setiap deploy Firebase Hosting apabila `main` berubah. Firebase Hosting dan rules dikonfigurasi dalam `firebase.json` dan `firestore.rules`.

Untuk melihat portal secara setempat, jalankan pelayan statik daripada akar repo. Auth Google dan Firestore memerlukan domain yang dibenarkan dalam Firebase Authentication; `localhost` dibenarkan untuk pembangunan.

## Pemasangan

Portal mempunyai web app manifest dan service worker. Laman dan aset penting disimpan untuk paparan ketika sambungan terputus; kandungan Firestore serta penghantaran borang memerlukan Internet.
