// Helper function to serialize MongoDB documents (convert _id to id)
export function serializeDocuments(documents: any[]): any[] {
  return documents.map((doc: any) => {
    const serializedDocument: Record<string, any> = {};
    for (const key in doc) {
      if (key === '_id') {
        serializedDocument['id'] = doc[key].toString();
      } else {
        serializedDocument[key] = doc[key];
      }
    }
    return serializedDocument;
  });
}

// Helper function to serialize a single MongoDB document (convert _id to id)
export function serializeDocument(doc: any): Record<string, any> {
  const serializedDocument: Record<string, any> = {};
  for (const key in doc) {
    if (key === '_id') {
      serializedDocument['id'] = doc[key].toString();
    } else {
      serializedDocument[key] = doc[key];
    }
  }
  return serializedDocument;
}
