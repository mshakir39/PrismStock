export function formatRupees(amount: number): string {
  if (amount === 0) return 'zero';

  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
  ];
  const teens = [
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = [
    '',
    'Ten',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];
  const thousands = ['', 'Thousand', 'Lakh', 'Crore'];

  const getBelowThousand = (n: number): string => {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' hundred ';
      n %= 100;
    }
    if (n > 10 && n < 20) {
      str += teens[n - 11] + ' ';
    } else {
      str += tens[Math.floor(n / 10)] + ' ';
      str += ones[n % 10] + ' ';
    }
    return str.trim();
  };

  const getBelowHundred = (n: number): string => {
    let str = '';
    if (n > 10 && n < 20) {
      str += teens[n - 11] + ' ';
    } else {
      str += tens[Math.floor(n / 10)] + ' ';
      str += ones[n % 10] + ' ';
    }
    return str.trim();
  };

  let result = '';
  let crorePart = Math.floor(amount / 10000000);
  amount %= 10000000;
  let lakhPart = Math.floor(amount / 100000);
  amount %= 100000;
  let thousandPart = Math.floor(amount / 1000);
  amount %= 1000;
  let hundredPart = Math.floor(amount / 100);
  let restPart = amount % 100;

  if (crorePart > 0) {
    result += getBelowThousand(crorePart) + ' Crore ';
  }
  if (lakhPart > 0) {
    result += getBelowThousand(lakhPart) + ' Lakh ';
  }
  if (thousandPart > 0) {
    result += getBelowThousand(thousandPart) + ' Thousand ';
  }
  if (hundredPart > 0) {
    result += ones[hundredPart] + ' Hundred ';
  }
  if (restPart > 0) {
    result += getBelowHundred(restPart);
  }

  return result.trim();
}
