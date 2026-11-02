export async function clearDataExport() {}

export async function saveDataExport(data: unknown) {
  const content = JSON.stringify(data, null, 2);
  const url = URL.createObjectURL(
    new Blob([content], { type: 'application/json' })
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `nextstep-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
