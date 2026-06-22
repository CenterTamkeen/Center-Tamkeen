export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.tamkeeen.online"
).replace(/\/$/, "");

export const siteName = "منصة تمكين";

export const siteTitle = "منصة تمكين التعليمية";

export const siteDescription =
  "منصة تمكين التعليمية لطلاب الثانوية العامة في الصعيد ومصر. كورسات أونلاين منظمة، مدرسين متخصصين، أكواد تفعيل آمنة، ومتابعة سهلة من حساب الطالب.";

export const seoKeywords = [
  "تمكين",
  "مبادرة تمكين",
  "منصة تمكين",
  "tamkeen",
  "tamkeeen",
  "Tamkeen",
  "Tamkeeen",
  "منصة تمكين التعليمية",
  "تمكين التعليمية",
  "كورسات تمكين",
  "مركز تمكين",
  "تعليم اونلاين",
  "كورسات اونلاين",
  "ثانوية عامة",
  "مدرسين ثانوية عامة",
  "كورسات الثانوية العامة",
  "طلاب الصعيد",
];

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}
