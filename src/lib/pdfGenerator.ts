import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BudgetItem } from './events';
import { Category } from './categories';

interface PDFData {
  eventName: string;
  eventDate?: string;
  venueName?: string;
  clientName?: string;
  organizerName?: string;
  budgetItems: BudgetItem[];
  categories: Category[];
  exchangeRate: number;
}

export async function generateBudgetPDF(data: PDFData): Promise<void> {
  const loadImageAsDataURL = async (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const logoDataURL = await loadImageAsDataURL('/image.png');

  const groupedByCategory: Record<string, BudgetItem[]> = {};
  data.budgetItems.forEach((item) => {
    const categoryId = item.category_id || 'uncategorized';
    if (!groupedByCategory[categoryId]) {
      groupedByCategory[categoryId] = [];
    }
    groupedByCategory[categoryId].push(item);
  });

  const categoryOrder = data.categories.map(c => c.id);
  const sortedCategoryIds = Object.keys(groupedByCategory).sort((a, b) => {
    return (categoryOrder.indexOf(a) || 999) - (categoryOrder.indexOf(b) || 999);
  });

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '794px';
  container.style.padding = '40px';
  container.style.backgroundColor = '#ffffff';
  container.style.fontFamily = 'Arial, sans-serif';

 let html = `
  <div style="font-family: Arial, sans-serif;">
    <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
      <div style="margin-right: 90px;">
        <img src="${logoDataURL}" style="width: 140px; height: auto;" alt="Logo" />
      </div>
      <div style="flex: 1; min-width: 0;">
        <div><strong>Тип мероприятия:</strong> ${data.eventName || ''}</div>
        <div><strong>Место проведения:</strong> ${data.venueName || ''}</div>
        <div><strong>Дата:</strong> ${data.eventDate ? new Date(data.eventDate).toLocaleDateString('ru-RU') : ''}</div>
        <div><strong>Заказчик:</strong> ${data.clientName || ''}</div>
        <div><strong>Организатор:</strong> ${data.organizerName || ''}</div>
        <div><strong>Версия сметы: 1</strong></div>
      </div>
    </div>
`;

  for (const categoryId of sortedCategoryIds) {
    const items = groupedByCategory[categoryId];
    const category = data.categories.find((c) => c.id === categoryId);
    const categoryName = category?.name || 'Без категории';

    html += `
  <h2 style="font-size: 16px; margin-bottom: 10px; font-weight: bold;">${categoryName}</h2>
  <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 2px;">
    <thead>
      <tr style="background-color: #e0e0e0;">
        <th style="border: 1px solid #ccc; padding: 5px 6px; text-align: center; width: 30px;">№</th>
        <th style="border: 1px solid #ccc; padding: 5px 6px; text-align: left;">Наименование</th>
        <th style="border: 1px solid #ccc; padding: 5px 6px; text-align: center; width: 90px;">Стоимость $</th>
        <th style="border: 1px solid #ccc; padding: 5px 6px; text-align: center; width: 80px;">Кол-во</th>
        <th style="border: 1px solid #ccc; padding: 5px 6px; text-align: center; width: 80px;">Ед. изм.</th>
        <th style="border: 1px solid #ccc; padding: 5px 6px; text-align: center; width: 70px;">Цена $</th>
      </tr>
    </thead>
    <tbody>
`;

    items.forEach((item, index) => {
      const priceUSD = item.price || 0;
      const totalUSD = item.total || 0;
      const itemName = item.equipment?.name || item.work_item?.name || 'Не указано';
      const itemUnit = item.work_item?.unit || 'шт.';

      html += `
    <tr>
      <td style="border: 1px solid #ccc; padding: 5px 6px; text-align: center;">${index + 1}</td>
      <td style="border: 1px solid #ccc; padding: 5px 6px;">${itemName}</td>
      <td style="border: 1px solid #ccc; padding: 5px 6px; text-align: center;">${priceUSD.toFixed(0)}</td>
      <td style="border: 1px solid #ccc; padding: 5px 6px; text-align: center;">${item.quantity || 1}</td>
      <td style="border: 1px solid #ccc; padding: 5px 6px; text-align: center;">${itemUnit}</td>
      <td style="border: 1px solid #ccc; padding: 5px 6px; text-align: center;">${totalUSD.toFixed(0)}</td>
    </tr>
  `;
});

    const categoryTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

    html += `
        </tbody>
      </table>
      <div style="text-align: right; font-weight: bold; font-size: 16px; margin-top: -5px">
        ИТОГО: ${categoryTotal.toFixed(0)} $
      </div>
    `;
  }

  const grandTotal = data.budgetItems.reduce((sum, item) => sum + (item.total || 0), 0);

  html += `
      <div style="margin-top: 10px; font-size: 16px; font-weight: bold;">
        ОБЩИЙ ИТОГ: ${grandTotal.toFixed(0)} $
      </div>
    </div>
  `;

  container.innerHTML = html;
  document.body.appendChild(container);

  const canvas = await html2canvas(container, {
    scale: 2,
    backgroundColor: '#ffffff',
    logging: false
  });

  document.body.removeChild(container);

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const imgWidth = 210;
  const pageHeight = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const eventDate = new Date().toISOString().split('T')[0];
  const fileName = `Smeta_${eventDate}.pdf`;
  pdf.save(fileName);
}
