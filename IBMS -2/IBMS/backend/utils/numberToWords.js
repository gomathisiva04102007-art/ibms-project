/**
 * Converts a number to words in Indian Numbering System (Lakhs, Crores)
 */

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertTwoDigits(n) {
  if (n < 20) return ones[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return tens[t] + (o ? ' ' + ones[o] : '');
}

function convertThreeDigits(n) {
  const h = Math.floor(n / 100);
  const rem = n % 100;
  let res = '';
  if (h > 0) {
    res += ones[h] + ' Hundred';
    if (rem > 0) res += ' and ';
  }
  if (rem > 0) {
    res += convertTwoDigits(rem);
  }
  return res;
}

function numberToIndianRupees(num) {
  if (num === null || num === undefined || isNaN(num)) return 'Zero Rupees Only';
  const rounded = Math.round(num * 100) / 100;
  const parts = rounded.toString().split('.');
  let integerPart = parseInt(parts[0], 10);
  const decimalPart = parts[1] ? parseInt(parts[1].padEnd(2, '0').slice(0, 2), 10) : 0;

  if (integerPart === 0 && decimalPart === 0) return 'Zero Rupees Only';

  let words = '';

  const crores = Math.floor(integerPart / 10000000);
  integerPart %= 10000000;

  const lakhs = Math.floor(integerPart / 100000);
  integerPart %= 100000;

  const thousands = Math.floor(integerPart / 1000);
  integerPart %= 1000;

  const hundreds = integerPart;

  if (crores > 0) {
    words += convertTwoDigits(crores) + ' Crore ';
  }
  if (lakhs > 0) {
    words += convertTwoDigits(lakhs) + ' Lakh ';
  }
  if (thousands > 0) {
    words += convertTwoDigits(thousands) + ' Thousand ';
  }
  if (hundreds > 0) {
    words += convertThreeDigits(hundreds) + ' ';
  }

  words = words.trim();
  let result = words ? 'Rupees ' + words : '';

  if (decimalPart > 0) {
    result += (result ? ' and ' : '') + convertTwoDigits(decimalPart) + ' Paise';
  }

  return (result + ' Only').trim();
}

module.exports = {
  numberToIndianRupees,
};
