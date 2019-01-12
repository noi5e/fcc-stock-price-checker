/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

const Stock = require('../models/stock')

chai.use(chaiHttp);

suite('Functional Tests', function() {
    
    suite('GET /api/stock-prices => stockData object', function() {
      
      test('1 stock', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog'})
        .end(function(err, res){
          
          assert.equal(res.status, 200)
          assert.isObject(res.body)
          assert.property(res.body, 'stock')
          assert.property(res.body, 'price')
          assert.property(res.body, 'likes')
          assert.isString(res.body.stock)
          assert.isString(res.body.price)
          assert.isArray(res.body.likes)
          
          done();
        });
      });
      
      test('1 stock with like', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({ stock: 'msft', like: true })
          .set('x-forwarded-for', 'Fake IP Address')
          .end(function(err, res) {
            assert.equal(res.status, 200)
            assert.isObject(res.body)
            assert.property(res.body, 'stock')
            assert.property(res.body, 'price')
            assert.property(res.body, 'likes')
            assert.isString(res.body.stock)
            assert.isString(res.body.price)
            assert.isArray(res.body.likes)
          
            assert.isAbove(res.body.likes.length, 0)
          
            done()
          })
      });
      
      test('1 stock with like again (ensure likes arent double counted)', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .set('x-forwarded-for', 'Fake IP Address')
          .query({ stock: 'msft', like: true })
          .end(function(err, res) {
            assert.equal(res.status, 200)
            assert.isObject(res.body)
            assert.property(res.body, 'stock')
            assert.property(res.body, 'price')
            assert.property(res.body, 'likes')
            assert.isString(res.body.stock)
            assert.isString(res.body.price)
            assert.isArray(res.body.likes)
          
            assert.equal(res.body.likes.length, 1)
          
            done()
          })
      });
      
      test('2 stocks', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({ stock: [ 'fb', 'amzn'] })
          .end(function(err, res) {
            assert.equal(res.status, 200)
            assert.isArray(res.body)
            assert.include(['FB', 'AMZN'], res.body[0].stock)
            assert.include(['FB', 'AMZN'], res.body[1].stock)
            assert.property(res.body[0], 'rel_likes')
            assert.property(res.body[1], 'rel_likes')
            assert.isNumber(res.body[0]['rel_likes'])
            assert.isNumber(res.body[1]['rel_likes'])
            done()
          })
      });
      
      test('2 stocks with like', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .set('x-forwarded-for', 'Fake IP Address')
          .query({ stock: [ 'fb', 'amzn'], like: true })
          .end(function(err, res) {
            assert.equal(res.status, 200)
            assert.isArray(res.body)
            assert.include(['FB', 'AMZN'], res.body[0].stock)
            assert.include(['FB', 'AMZN'], res.body[1].stock)
            assert.property(res.body[0], 'rel_likes')
            assert.property(res.body[1], 'rel_likes')
            assert.isNumber(res.body[0]['rel_likes'])
            assert.isNumber(res.body[1]['rel_likes'])
          
            Stock.findOne({ stock: 'FB' }, (err, stock) => {
              assert.isAbove(stock.likes.length, 0)
              
              done()
            })
          })
      });
      
    });

});
