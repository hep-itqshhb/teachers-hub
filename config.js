/*
 * Central link configuration for ITQSHHB Teacher's Hub.
 * Form and activity-calendar URLs were supplied for this version.
 */
const HUB_CONFIG = Object.freeze({
  siteName: "ITQSHHB Teacher's Hub",
  canonicalUrl: "https://teachershub-itq.web.app/",
  // Pilihan: masukkan URL CSV Google Sheet yang telah "Publish to web".
  // Lajur yang disokong: type,title,date,summary,link,status,expiresAt.
  contentFeedUrl: "",
  analytics: Object.freeze({
    // Masukkan URL tapak GoatCounter ITQSHHB selepas tapak didaftarkan.
    // Contoh format sahaja: https://kod-anda.goatcounter.com
    goatcounterSite: ""
  }),
  links: Object.freeze({
    disiplin: "https://forms.gle/vK4N22ELNCywPM2Z7",
    hafazan: "https://forms.gle/jymEJZBK3dqrMZ7SA",
    akademik: "https://forms.gle/n3gdwBWqRN3y2x3dA",
    aktiviti: "https://forms.gle/LrfAJvvkgpXGqqwy8",
    kalendar: "https://script.google.com/macros/s/AKfycbxbKeQNSAoQcmg91LcHAv_J9B2QUw8mhATyG44a12zPc-_kA7kOkeV2Q7JlIdPuj22H-g/exec",
    bpp: "https://hep-itqshhb.github.io/bpp-itq/"
  }),
  serviceStatus: Object.freeze({
    disiplin: Object.freeze({ status: "active", note: "Akaun organisasi mungkin diperlukan" }),
    hafazan: Object.freeze({ status: "active", note: "Akaun organisasi mungkin diperlukan" }),
    akademik: Object.freeze({ status: "active", note: "Akaun organisasi mungkin diperlukan" }),
    aktiviti: Object.freeze({ status: "active", note: "Untuk HOD atau penganjur aktiviti" }),
    kalendar: Object.freeze({ status: "active", note: "Dikemas kini melalui kalendar Institut" }),
    bpp: Object.freeze({ status: "active", note: "Laman rasmi BPP" })
  }),
  importantDates: Object.freeze([
    Object.freeze({
      title: "Tempahan Tarikh Aktiviti Tahun 2027",
      date: "2026-11-21T23:59:59+08:00",
      label: "Tarikh akhir",
      status: "active"
    })
  ]),
  announcements: Object.freeze([
    Object.freeze({
      title: "Alamat baharu Teacher's Hub",
      date: "2026-10-17",
      summary: "Teacher's Hub kini boleh diakses melalui alamat Firebase Hosting yang lebih ringkas.",
      link: "https://teachershub-itq.web.app/",
      linkLabel: "Buka alamat baharu",
      status: "active"
    }),
    Object.freeze({
      title: "Tempahan aktiviti tahun 2027",
      date: "2026-10-17",
      summary: "Sila semak Kalendar Aktiviti dan lengkapkan tempahan sebelum tarikh akhir yang dinyatakan.",
      link: "https://script.google.com/macros/s/AKfycbxbKeQNSAoQcmg91LcHAv_J9B2QUw8mhATyG44a12zPc-_kA7kOkeV2Q7JlIdPuj22H-g/exec",
      linkLabel: "Semak kalendar",
      expiresAt: "2026-11-21T23:59:59+08:00",
      status: "active"
    })
  ])
});

