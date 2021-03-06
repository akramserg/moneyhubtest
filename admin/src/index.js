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

  //GET USERS AND THEIR INVESTMENTS
  request.get(
    `${config.investmentsServiceUrl}/investments`,
    async (e, r, invest) => {
      if (e) {
        console.error(e)
        res.send(500)
      } else {
        //GET COMPANIES
        request.get(`${config.companiesUrl}/companies`, (e, r, comp) => {
          if (e) {
            console.error(e)
            res.send(500)
          } else {
            const companies = JSON.parse(comp)
            const investments = JSON.parse(invest)
            let allHoldings = []

            getFormattedData(investments, companies, allHoldings)
            createCSVFile(allHoldings)


            //SEND CSV FORMATTED DATA TO EXPORT
            request.post(
              `${config.investmentsServiceUrl}/investments/export`,
              { json: allHoldings },
              (e, r, response) => {
                if (e) {
                  console.error(e)
                  res.send(500)
                } else {
                  return res.send('DATA SENT TO /EXPORT')
                }
              },
            )


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


const createCSVFile = (allHoldings) => {
  //CREATE A CSV DOCUMENT
  const csvWriter = createCsvWriter({
    path: 'holdings.csv',
    header: [
      { id: 'user', title: 'User' },
      { id: 'firstName', title: 'First Name' },
      { id: 'lastName', title: 'Last Name' },
      { id: 'date', title: 'Date' },
      { id: 'holding', title: 'Holding' },
      { id: 'value', title: 'Value' },
    ],
  })

  const csv = csvWriter
    .writeRecords(allHoldings)
    .then(() => console.log('The CSV file was written successfully'))
}


const findCompanyById = (id, companies) => {
  return R.find((company) => {
    return company.id === id
  }, companies)
}

const getUserHoldings = (user, companies) => {
  return R.map((holding) => {
    const company = findCompanyById(holding.id, companies)
    return {
      holding: company.name,
      value: user.investmentTotal * holding.investmentPercentage,
    }
  }, user.holdings)
}

const getFormattedData = (investments, companies, allHoldings) => {
  return  R.map((user) => {
    for (let h of getUserHoldings(user, companies)) {
      allHoldings.push({
        user: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        date: user.date,
        holding: h.holding,
        value: h.value,
      })
    }
  }, investments)
}

