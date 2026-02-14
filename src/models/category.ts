// import mongoose, { Document, Schema } from 'mongoose';

// export interface ICategory extends Document
// {
//   serial:string,
//   brandName:string
// }

// const categorySchena:Schema=new mongoose.Schema({
//   serial:{
//     type:String,
//     required:true
//   },
//   brandName:{
//     type:String,
//     required:true
//   },
// },{
//   capped: { size: 1024 },
//   bufferCommands: false,
//   autoCreate: false // disable `autoCreate` since `bufferCommands` is false
// })

// const Category=mongoose.models.Category||mongoose.model<ICategory>("Category",categorySchena)
// export default Category
