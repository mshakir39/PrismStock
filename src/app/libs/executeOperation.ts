'use server';
import { ObjectId } from 'mongodb';
import { connectToMongoDB } from './connectToMongoDB';

export async function executeOperation(
  collectionName: string,
  operation: string,
  document: any | null = null,
  options: any = null
) {
  try {
    // Always get a fresh connection instead of reusing a global variable
    const db = await connectToMongoDB();

    if (!db) {
      throw new Error('Failed to connect to database');
    }

    // Check if the collection exists
    const collectionExists = await db
      .listCollections({ name: collectionName })
      .toArray();

    // If the collection does not exist, create it
    if (collectionExists.length === 0) {
      await db.createCollection(collectionName);
    }

    // If a document is provided, perform the operation on the collection
    if (document) {
      const brandName = document?.brandName;
      const series = document?.series;

      switch (operation) {
        case 'insertOne':
          return await db.collection(collectionName).insertOne(document);

        case 'insertMany':
          return await db.collection(collectionName).insertMany(document);

        case 'insertStock':
          const existingDocument = await db
            .collection(collectionName)
            .findOne({ brandName: document.brandName });

          if (existingDocument) {
            return await db.collection(collectionName).updateOne(
              { brandName: document.brandName },
              {
                $set: document,
              }
            );
          } else {
            // Ensure all numeric fields are numbers before inserting
            const stockDocument = {
              ...document,
              seriesStock: document.seriesStock.map((stock: any) => ({
                ...stock,
                productCost: parseFloat(stock.productCost) || 0,
                inStock: parseInt(stock.inStock) || 0,
                soldCount: 0, // Initialize soldCount as number
                createdDate: new Date(),
              })),
            };
            return await db.collection(collectionName).insertOne(stockDocument);
          }

        case 'updateSeries':
          return await db
            .collection(collectionName)
            .updateMany(
              { brandName },
              { $addToSet: { series: { $each: [series] } } }
            );

        case 'updateStock': {
          const updateSeriesDoc = await db
            .collection(collectionName)
            .findOne({ brandName: document.brandName });

          if (!updateSeriesDoc) {
            throw new Error(`Brand '${document.brandName}' not found.`);
          }

          const seriesStock = updateSeriesDoc.seriesStock.find(
            (item: any) => item.series === series
          );

          if (!seriesStock) {
            throw new Error(`Series '${series}' not found in stock.`);
          }

          const currentInStock = parseInt(seriesStock.inStock) || 0;
          const currentSoldCount = parseInt(seriesStock.soldCount) || 0;
          const updateQuantity = parseInt(document.quantity) || 0;

          if (currentInStock === 0) {
            throw new Error(
              `Stock for series '${series}' is already depleted.`
            );
          } else if (updateQuantity > currentInStock) {
            throw new Error(
              `Insufficient stock for series '${series}'. Available stock: ${currentInStock}`
            );
          }

          const newInStock = currentInStock - updateQuantity;
          const newSoldCount = currentSoldCount + updateQuantity;

          console.log(
            `🔄 Stock update result for ${series}: inStock ${currentInStock} → ${newInStock}, soldCount ${currentSoldCount} → ${newSoldCount}`
          );

          return await db
            .collection(collectionName)
            .updateOne(
              { 'seriesStock.series': series },
              {
                $set: {
                  'seriesStock.$.inStock': newInStock,
                  'seriesStock.$.soldCount': newSoldCount,
                  'seriesStock.$.updatedDate':
                    document.seriesStock[0].updatedDate,
                },
              }
            );
        }

        case 'updateStockAndSoldCount': {
          const updateQuantity = parseInt(document.quantity) || 0;
          
          if (collectionName === 'products') {
            // Handle products collection (has inStock field directly)
            const updateProductDoc = await db
              .collection(collectionName)
              .findOne({ brandName: document.brandName, series: series });

            if (!updateProductDoc) {
              throw new Error(`Product with brand '${document.brandName}' and series '${series}' not found.`);
            }

            const currentStock = parseInt(updateProductDoc.inStock) || 0;
            const currentSoldCount = parseInt(updateProductDoc.soldCount) || 0;

            console.log(
              `📦 Product stock update for ${series}: currentInStock=${currentStock}, currentSoldCount=${currentSoldCount}, updateQuantity=${updateQuantity}`
            );

            const newStock = currentStock - updateQuantity;
            const newSoldCount = currentSoldCount + updateQuantity;

            console.log(
              `🔄 Product stock update result for ${series}: inStock ${currentStock} → ${newStock}, soldCount ${currentSoldCount} → ${newSoldCount}`
            );

            return await db
              .collection(collectionName)
              .updateOne(
                { brandName: document.brandName, series: series },
                {
                  $set: {
                    inStock: newStock.toString(),
                    soldCount: newSoldCount.toString(),
                    updatedDate: new Date(),
                  },
                }
              );
          } else {
            // Handle stock collection (old structure with seriesStock array)
            const updateSeriesDoc = await db
              .collection(collectionName)
              .findOne({ brandName: document.brandName });

            if (!updateSeriesDoc) {
              throw new Error(`Brand '${document.brandName}' not found.`);
            }

            const seriesStock = updateSeriesDoc.seriesStock.find(
              (item: any) => item.series === series
            );

            if (!seriesStock) {
              throw new Error(`Series '${series}' not found in stock.`);
            }

            const currentInStock = parseInt(seriesStock.inStock) || 0;
            const currentSoldCount = parseInt(seriesStock.soldCount) || 0;

            console.log(
              `📦 Stock update for ${series}: currentInStock=${currentInStock}, currentSoldCount=${currentSoldCount}, updateQuantity=${updateQuantity}`
            );

            if (currentInStock === 0) {
              throw new Error(
                `Stock for series '${series}' is already depleted.`
              );
            } else if (updateQuantity > currentInStock) {
              throw new Error(
                `Insufficient stock for series '${series}'. Available stock: ${currentInStock}`
              );
            }

            const newInStock = currentInStock - updateQuantity;
            const newSoldCount = currentSoldCount + updateQuantity;

            console.log(
              `🔄 Stock update result for ${series}: inStock ${currentInStock} → ${newInStock}, soldCount ${currentSoldCount} → ${newSoldCount}`
            );

            return await db
              .collection(collectionName)
              .updateOne(
                { 'seriesStock.series': series },
                {
                  $set: {
                    'seriesStock.$.inStock': newInStock,
                    'seriesStock.$.soldCount': newSoldCount,
                    'seriesStock.$.updatedDate':
                      document.seriesStock[0].updatedDate,
                  },
                }
              );
          }
        }

        case 'updateMany':
          const filter = document.filter;
          const updateData = document.data;
          const hasOps = Object.keys(updateData).some(key => key.startsWith('$'));
          const updateDoc = hasOps ? updateData : { $set: updateData };
          return await db.collection(collectionName).updateMany(filter, updateDoc);

        case 'updateOne':
          if (collectionName === 'categories' && document.data) {
            const id = new ObjectId(document.id);
            // Check if data contains MongoDB update operators (keys starting with $)
            const hasOperators = Object.keys(document.data).some(key => key.startsWith('$'));
            const updateDoc = hasOperators
              ? document.data
              : {
                  $set: {
                    ...document.data,
                    addedDate: new Date(),
                  },
                };
            return await db.collection(collectionName).updateOne({ _id: id }, updateDoc);
          } else {
            const id = new ObjectId(document.documentId);
            const update = {
              ...document,
              addedDate: new Date(),
            };
            return await db
              .collection(collectionName)
              .updateOne({ _id: id }, { $set: update });
          }

        case 'delete':
          const deleteId = new ObjectId(document.id);
          return await db
            .collection(collectionName)
            .deleteOne({ _id: deleteId });

        case 'deleteOne':
          return await db.collection(collectionName).deleteOne(document);

        case 'isExist':
          // Check if a document exists in the collection
          const existResult = await db
            .collection(collectionName)
            .findOne(document);
          return existResult !== null;

        case 'upsert':
          if ('_id' in document) {
            const docExists = await db
              .collection(collectionName)
              .findOne({ _id: document._id });
            if (docExists) {
              return await db
                .collection(collectionName)
                .updateOne({ _id: document._id }, { $set: document });
            } else {
              return await db.collection(collectionName).insertOne(document);
            }
          } else {
            return await db.collection(collectionName).insertOne(document);
          }

        case 'isSeriesExistInStock':
          const field = document.field; // Get the dynamic field name
          const value = document.value; // Get the dynamic field value
          const found = await db
            .collection(collectionName)
            .findOne({ seriesStock: { $elemMatch: { [field]: value } } });
          return found !== null;

        case 'findOne':
          const doc = await db.collection(collectionName).findOne({ _id: new ObjectId(document.id) });
          if (doc) {
            const serializedDocument: Record<string, any> = {};
            for (const key in doc) {
              if (key === '_id') {
                serializedDocument['id'] = doc[key].toString();
              } else {
                serializedDocument[key] = doc[key];
              }
            }
            return serializedDocument;
          } else {
            return null;
          }

        case 'find':
          let query = db.collection(collectionName).find(document || {});
          if (options) {
            if (options.sort) {
              query = query.sort(options.sort);
            }
            if (options.limit) {
              query = query.limit(options.limit);
            }
            if (options.skip) {
              query = query.skip(options.skip);
            }
          }
          const documents = await query.toArray();
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

        case 'findByClientId':
          const clientDocuments = await db
            .collection(collectionName)
            .find({ clientId: document.clientId })
            .toArray();
          return clientDocuments.map((doc: any) => {
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

        case 'findUsersByClientRef':
          const users = await db
            .collection(collectionName)
            .find({ clientRef: document.clientRef })
            .toArray();
          return users.map((doc: any) => {
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

        case 'count':
          return await db.collection(collectionName).countDocuments(document || {});

        case 'findAllWithFilter':
          let filteredQuery = db.collection(collectionName).find(document || {});
          if (options) {
            if (options.sort) {
              filteredQuery = filteredQuery.sort(options.sort);
            }
            if (options.limit) {
              filteredQuery = filteredQuery.limit(options.limit);
            }
            if (options.skip) {
              filteredQuery = filteredQuery.skip(options.skip);
            }
          }
          const filteredDocuments = await filteredQuery.toArray();
          return filteredDocuments.map((doc: any) => {
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

        default:
          throw new Error(`Invalid operation: ${operation}`);
      }
    } else {
      // For operations that don't require a document
      switch (operation) {
        case 'find':
        case 'findAll':
          let query = db.collection(collectionName).find(document || {});
          if (options) {
            if (options.sort) {
              query = query.sort(options.sort);
            }
            if (options.limit) {
              query = query.limit(options.limit);
            }
            if (options.skip) {
              query = query.skip(options.skip);
            }
          }
          const allDocuments = await query.toArray();
          return allDocuments.map((doc: any) => {
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

        default:
          throw new Error(`Invalid operation: ${operation}`);
      }
    }
  } catch (error) {
    console.error('Database operation error:', error);
    throw error;
  }
}
