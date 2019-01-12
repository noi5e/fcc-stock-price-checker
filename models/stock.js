const mongoose = require('mongoose')

const StockSchema = mongoose.Schema({
  stock: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  likes: []
})

const Stock = module.exports = mongoose.model('Stock', StockSchema)