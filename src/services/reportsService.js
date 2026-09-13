export function exportToCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map((row) =>
        keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k];
            cell = cell.toString().replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator)
      )
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function generateDailyReportData() {
  return [
    { Date: '2026-08-02', Time: '08:00', Solar_kW: 6.8, Wind_kW: 2.4, Hydro_kW: 0.9, Total_kWh: 10.1, Carbon_Avoided_kg: 7.3 },
    { Date: '2026-08-02', Time: '12:00', Solar_kW: 12.5, Wind_kW: 1.8, Hydro_kW: 1.0, Total_kWh: 15.3, Carbon_Avoided_kg: 11.2 },
    { Date: '2026-08-02', Time: '16:00', Solar_kW: 10.2, Wind_kW: 2.2, Hydro_kW: 1.0, Total_kWh: 13.4, Carbon_Avoided_kg: 9.8 },
    { Date: '2026-08-02', Time: '20:00', Solar_kW: 0.0, Wind_kW: 2.8, Hydro_kW: 0.8, Total_kWh: 3.6, Carbon_Avoided_kg: 2.6 },
  ];
}

export function generateWeeklyReportData() {
  return [
    { Day: 'Monday', Date: '2026-07-27', Solar_kWh: 45, Wind_kWh: 18, Hydro_kWh: 8, Battery_kWh: 5, Total_kWh: 76, Savings_INR: 547.2 },
    { Day: 'Tuesday', Date: '2026-07-28', Solar_kWh: 52, Wind_kWh: 16, Hydro_kWh: 8, Battery_kWh: 6, Total_kWh: 82, Savings_INR: 590.4 },
    { Day: 'Wednesday', Date: '2026-07-29', Solar_kWh: 48, Wind_kWh: 22, Hydro_kWh: 8, Battery_kWh: 4, Total_kWh: 82, Savings_INR: 590.4 },
    { Day: 'Thursday', Date: '2026-07-30', Solar_kWh: 60, Wind_kWh: 15, Hydro_kWh: 9, Battery_kWh: 7, Total_kWh: 91, Savings_INR: 655.2 },
    { Day: 'Friday', Date: '2026-07-31', Solar_kWh: 58, Wind_kWh: 19, Hydro_kWh: 8, Battery_kWh: 5, Total_kWh: 90, Savings_INR: 648.0 },
    { Day: 'Saturday', Date: '2026-08-01', Solar_kWh: 65, Wind_kWh: 21, Hydro_kWh: 9, Battery_kWh: 8, Total_kWh: 103, Savings_INR: 741.6 },
    { Day: 'Sunday', Date: '2026-08-02', Solar_kWh: 70, Wind_kWh: 24, Hydro_kWh: 9, Battery_kWh: 6, Total_kWh: 109, Savings_INR: 784.8 },
  ];
}

export function generateMonthlyReportData() {
  return [
    { Month: 'January', Year: 2026, Generation_kWh: 2110, Consumption_kWh: 1420, Grid_Feed_In_INR: 16880, CO2_Saved_Tons: 1.5 },
    { Month: 'February', Year: 2026, Generation_kWh: 2230, Consumption_kWh: 1390, Grid_Feed_In_INR: 17840, CO2_Saved_Tons: 1.6 },
    { Month: 'March', Year: 2026, Generation_kWh: 2660, Consumption_kWh: 1450, Grid_Feed_In_INR: 21280, CO2_Saved_Tons: 1.9 },
    { Month: 'April', Year: 2026, Generation_kWh: 2870, Consumption_kWh: 1480, Grid_Feed_In_INR: 22960, CO2_Saved_Tons: 2.1 },
    { Month: 'May', Year: 2026, Generation_kWh: 3220, Consumption_kWh: 1520, Grid_Feed_In_INR: 25760, CO2_Saved_Tons: 2.3 },
    { Month: 'June', Year: 2026, Generation_kWh: 3540, Consumption_kWh: 1600, Grid_Feed_In_INR: 28320, CO2_Saved_Tons: 2.5 },
    { Month: 'July', Year: 2026, Generation_kWh: 3680, Consumption_kWh: 1650, Grid_Feed_In_INR: 29440, CO2_Saved_Tons: 2.6 },
  ];
}
