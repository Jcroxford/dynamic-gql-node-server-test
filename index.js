import express from 'express'
import jsonGraphqlExpress from 'json-graphql-server'
import { LowSync, JSONFileSync } from 'lowdb'
import _ from 'lodash'

const db = new LowSync(new JSONFileSync('./db.json'))
db.read()
db.chain = _.chain(db.data)

const app = express()

function saveChangesToDB(req, res, next) {
  res.on('finish', function () {
    // when switching switching routes, id will be undefind. breaking early prevent errors when saving
    // with an undefined id
    if(req?.params?.id == undefined) return
    db.data.schemas[Number(req.params.id)] = req.data
    db.write()
  })
  next()
}
app.use(saveChangesToDB)

function findCorrectSchemaMiddleware(req, res, next) {
  let schema = db
    .chain
    .get('schemas')
    .nth(Number(req.params.id))
    .value()

  req.data = schema
  next()
}

function dynamiclyGenerateSchemaMiddleware(req, res, next) {
  jsonGraphqlExpress.default(req.data)(req, res)
  next()
}

app.use('/:id/graphql', findCorrectSchemaMiddleware, dynamiclyGenerateSchemaMiddleware)

const PORT = 3000
app.listen(PORT, (err) => {
  console.log(`running on http://localhost:${PORT}`)
})
