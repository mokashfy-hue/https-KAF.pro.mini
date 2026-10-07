// Arabic Number to Words (Tafqeet) Converter for Financial Vouchers

const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
const tens = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const teens = [
  "عشرة",
  "أحد عشر",
  "اثنا عشر",
  "ثلاثة عشر",
  "أربعة عشر",
  "خمسة عشر",
  "ستة عشر",
  "سبعة عشر",
  "ثمانية عشر",
  "تسعة عشر",
];
const hundreds = [
  "",
  "مائة",
  "مائتان",
  "ثلاثمائة",
  "أربعمائة",
  "خمسمائة",
  "ستمائة",
  "سبعمائة",
  "ثمانمائة",
  "تسعمائة",
];

function convertThreeDigits(num: number): string {
  if (num === 0) return "";
  const h = Math.floor(num / 100);
  const rem = num % 100;
  const t = Math.floor(rem / 10);
  const o = rem % 10;

  const parts: string[] = [];

  if (h > 0) parts.push(hundreds[h]);

  if (rem > 0) {
    if (rem >= 10 && rem <= 19) {
      parts.push(teens[rem - 10]);
    } else if (t === 0) {
      parts.push(ones[o]);
    } else if (o === 0) {
      parts.push(tens[t]);
    } else {
      parts.push(`${ones[o]} و${tens[t]}`);
    }
  }

  return parts.join(" و");
}

export function numberToArabicWords(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num) || num === 0) return "صفر ريال سعودي";

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) return "صفر ريال سعودي";

  const billions = Math.floor(integerPart / 1000000000);
  const millions = Math.floor((integerPart % 1000000000) / 1000000);
  const thousands = Math.floor((integerPart % 1000000) / 1000);
  const units = integerPart % 1000;

  const chunks: string[] = [];

  if (billions > 0) {
    if (billions === 1) chunks.push("مليار");
    else if (billions === 2) chunks.push("ملياران");
    else if (billions >= 3 && billions <= 10) chunks.push(`${convertThreeDigits(billions)} مليارات`);
    else chunks.push(`${convertThreeDigits(billions)} مليار`);
  }

  if (millions > 0) {
    if (millions === 1) chunks.push("مليون");
    else if (millions === 2) chunks.push("مليونان");
    else if (millions >= 3 && millions <= 10) chunks.push(`${convertThreeDigits(millions)} ملايين`);
    else chunks.push(`${convertThreeDigits(millions)} مليون`);
  }

  if (thousands > 0) {
    if (thousands === 1) chunks.push("ألف");
    else if (thousands === 2) chunks.push("ألفان");
    else if (thousands >= 3 && thousands <= 10) chunks.push(`${convertThreeDigits(thousands)} آلاف`);
    else chunks.push(`${convertThreeDigits(thousands)} ألف`);
  }

  if (units > 0) {
    chunks.push(convertThreeDigits(units));
  }

  let result = chunks.join(" و");
  result += " ريال سعودي";

  if (decimalPart > 0) {
    result += ` و${convertThreeDigits(decimalPart)} هللة`;
  }

  return `فقط وقدره ${result} لا غير`;
}
