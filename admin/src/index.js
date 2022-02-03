const express = require('express')
const bodyParser = require('body-parser')
const config = require('config')
const request = require('request')
const R = require('ramda')
const createCsvWriter = require('csv-writer').createObjectCsvWriter

const app = express()

app.use(bodyParser.json({ limit: '10mb' }))

app.get('/investments/:id', (req, res) => {
  const { id } = req.params
  request.get(
    `${config.investmentsServiceUrl}/investments/${id}`,
    (e, r, investments) => {
      if (e) {
        console.error(e)
        res.send(500)
      } else {
        res.send(investments)
      }
    },
  )
})

//CHECKED THE INVESTMENT SERVICE AND THERE IS AN API READY TO GET ALL INVESTMENTS IN ONE CALL
//WILL BE IMPLEMENTED HERE
app.get('/generatecsv', async (req, res) => {
  console.log('GET: generatecsv')
  const { id } = req.params
  request.get(
    `${config.investmentsServiceUrl}/investments`,
    async (e, r, investments) => {
      if (e) {
        console.error(e)
        res.send(500)
      } else {
        //CREATE A CSV DOCUMENT
        const csvWriter = createCsvWriter({
          path: 'out.csv',
          header: [
            { id: 'user', title: 'User' },
            { id: 'firstName', title: 'First Name' },
            { id: 'lastName', title: 'Last Name' },
            { id: 'date', title: 'Date' },
            { id: 'holding', title: 'Holding' },
            { id: 'value', title: 'Value' },
          ],
        })

        let allHoldings = []
      

        const getUserHoldings = R.map((holding) => {
          return {
            holding: 'name of company with id '+holding.id,
            value: 'VALUE HERE',
          }
        })

        
        const getFormattedData = R.map((user) => {
          console.log(getUserHoldings(user.holdings))
          for (let h of getUserHoldings(user.holdings)) {
            console.log(h)
            allHoldings.push({
              user: user.userId,
              firstName: user.firstName,
              lastName: user.lastName,
              date: user.date,
              holding: h.holding,
              value: h.value,
            })
          }
        })
        getFormattedData(JSON.parse(investments))
        console.log(allHoldings)

        // const data =
        // csvWriter
        //   .writeRecords(data)
        //   .then(() => console.log('The CSV file was written successfully'))
        res.send(allHoldings)
      }
    },
  )
})

app.listen(config.port, (err) => {
  if (err) {
    console.error('Error occurred starting the server', err)
    process.exit(1)
  }
  console.log(`Server running on port ${config.port}`)
})

//FUNCTIONS HERE
const getALlHoldings = async () => {
  return await request.get(
    `${config.companiesUrl}/companies`,
    (e, r, companies) => {
      if (e) {
        console.error(e)
        return null
      } else {
        console.log(companies)
        return companies
      }
    },
  )
}
