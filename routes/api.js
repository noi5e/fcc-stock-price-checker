/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';
const axios = require('axios')
const format = require('date-format')
const async = require('async')
const Stock = require('../models/stock')

module.exports = function (app) {
  
  function findOrAddStock(ticker, price, like, iPAddress, callback) {
    Stock.findOne({ stock: ticker }, (error, stock) => {
      if (error) { callback(error, null) }
      
      if (!stock) {

        const newStockData = {
          stock: ticker,
          price: price,
          likes: like ? [iPAddress] : []
        }

        const stockToSave = new Stock(newStockData)

        stockToSave.save((error, newStock) => {
          if (error) { callback(error, null) }
          callback(null, newStock)
        })

      } else {

        stock.price = price

        if (like) {
          let iPAddressAlreadyVoted = false

          for (let i = 0; i < stock.likes.length; i++) {                
            if (stock.likes[i] === iPAddress) {
              console.log('found ip address')
              iPAddressAlreadyVoted = true
            }
          }

          if (!iPAddressAlreadyVoted) {
            console.log('adding like')
            stock.likes = stock.likes.concat([iPAddress])
            stock.markModified('likes')
          }
        }

        stock.save((error, newStock) => {
          if (error) { callback(error, null) }
          
          callback(null, newStock)
        })

      }
    })
  }
  
  function makeAlphaVantageRequest(ticker) {
    return axios({
      method: 'get',
      url: 'https://www.alphavantage.co/query',
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: encodeURIComponent(ticker),
        apikey: process.env.ALPHA_VANTAGE_API_KEY
      }
    })
  }
  
  app.route('/api/stock-prices')
    .get(function (req, res){
    
      if (typeof req.query.stock === 'string') {
      
        makeAlphaVantageRequest(req.query.stock.toUpperCase())
          .then((response) => {
          
          // function findOrAddStock(ticker, price, like, iPAddress, callback)
          findOrAddStock(req.query.stock, response.data['Global Quote']['05. price'].toString(), req.query.like, req.headers['x-forwarded-for'], (error, stock) => {

            if (error) { res.status(500).send('server error while handling stock request') }

            res.status(200).json(stock)
          })
          
        })
        
      } else if (Array.isArray(req.query.stock)) {
        
        axios.all([makeAlphaVantageRequest(req.query.stock[0]), makeAlphaVantageRequest(req.query.stock[1])])
          .then(axios.spread(function (stockDataOne, stockDataTwo) {
            
            let stocksFromDatabase = []
          
            async.each([stockDataOne, stockDataTwo], (stockData, callback) => {
              
              const stockTicker = stockData.data['Global Quote']['01. symbol']
              const stockPrice = stockData.data['Global Quote']['05. price'].toString()
              const iPAddress = req.headers['x-forwarded-for']
              
              findOrAddStock(stockTicker, stockPrice, req.query.like, iPAddress, (error, stock) => {
                stocksFromDatabase.push(stock)
                callback(error)
              })
            }, (error) => {
              if (error) { res.status(500).send('error looking up stocks on server end.') }
              
              const finishedStocks = stocksFromDatabase.map((stock) => {
                return {
                  stock: stock.stock,
                  price: stock.price,
                }
              })
              
              finishedStocks[0].rel_likes = stocksFromDatabase[0].likes.length - stocksFromDatabase[1].likes.length
              finishedStocks[1].rel_likes = stocksFromDatabase[1].likes.length - stocksFromDatabase[0].likes.length
              
              res.status(200).json(finishedStocks)
            })
          }));
        
      }
    });
    
};
