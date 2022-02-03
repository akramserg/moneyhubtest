const express = require('express')
const bodyParser = require('body-parser')
const config = require('config')
const request = require('request')
const R = require('ramda')
const createCsvWriter = require('csv-writer').createObjectCsvWriter
const c = require('config')

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
        //GET COMPANIES
        request.get(`${config.companiesUrl}/companies`, (e, r, comp) => {
          if (e) {
            console.error(e)
            return null
          } else {
            const companies = JSON.parse(comp)
            console.log(companies)

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

            const findCompanyById = (id, companies) => {
              return R.find((company) => {
                return company.id === id
              }, companies)
            }

            const getUserHoldings = (holdings, user) => {
              // console.log("----user")
              // console.log(user)
              // console.log(user.investmentTotal)
              return R.map((holding) => {
                const company = findCompanyById(holding.id, companies)
                return {
                  holding: company.name,
                  value: user.investmentTotal * holding.investmentPercentage,
                }
              }, holdings)
            }

            const getFormattedData = R.map((user) => {
              for (let h of getUserHoldings(user.holdings, user)) {
                console.log('-------')
                console.log(h)
                console.log(user)
                console.log('-------')

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

            console.log(JSON.parse(investments))
            getFormattedData(JSON.parse(investments))
            console.log(allHoldings)

            const csv = csvWriter
              .writeRecords(allHoldings)
              .then(() => console.log('The CSV file was written successfully'))
            

              // res.send(allHoldings)

            return res.send(allHoldings)
          }
        })
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
