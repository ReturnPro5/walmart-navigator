export async function getAllRecords(limit = 1000) {
  const db = await getDB();
  const tx = db.transaction("records", "readonly");
  const store = tx.objectStore("records");

  const rows: any[] = [];
  let cursor = await new Promise<IDBCursorWithValue | null>((res, rej) => {
    const req = store.openCursor();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });

  while (cursor && rows.length < limit) {
    rows.push(cursor.value);
    cursor = await new Promise<IDBCursorWithValue | null>((res, rej) => {
      const req = cursor.continue();
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  }

  await tx.done;
  return rows;
}

export async function getStats() {
  const total = await countRecords();
  return { total };
}
