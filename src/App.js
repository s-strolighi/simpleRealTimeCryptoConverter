import { useState } from "react";
import { Navbar, Container, Card, InputGroup, FormControl, Button } from "react-bootstrap";
import logo from './logo512.png';

const App = () => {

  const url = "https://api.coingecko.com/api/v3/coins/"

  const cryptoIdList = ["green-satoshi-token", "stepn", "solana"]
  const fiatIdList = ["eur", "usd"]
  const [currentGstUsdPrice, setCurrentGstUsdPrice] = useState(0)

  const symbols = { 'green-satoshi-token': 'GST', 'stepn': 'GMT', 'solana': 'SOL' }

  const [allValues, setAllValues] = useState({})
  const [mintValues, setMintValues] = useState({
    "200-0": { "eur": 0, "sol": 0 },
    "160-40": { "eur": 0, "sol": 0 },
    "120-80": { "eur": 0, "sol": 0 },
    "100-100": { "eur": 0, "sol": 0 },
    "80-120": { "eur": 0, "sol": 0 },
    "40-160": { "eur": 0, "sol": 0 }
  })
  const [levelCost, setLevelCost] = useState({ "5": { "eur": 0, "sol": 0 } })

  const getValue = async (from) => {
    return await fetch(url + from)
      .then((response) => {
        if (!response.ok) throw new Error(response.status);
        else return response.json();
      })
      .then((data) => {
        return data
      })
      .catch((error) => {
        console.log('error: ' + error);
        this.setState({ requestFailed: true });
      });
  }

  const handleChangeText = (title, value) => {
    let allValuesUpdated = { ...allValues };
    allValuesUpdated[title] = value;
    setAllValues(allValuesUpdated)
    setValuesFromConversion(title, value)
  }

  const updateMintStats = () => {
    let mintValuesUpdated = mintValues;
    let levelCostUpdated = levelCost;
    getValue('green-satoshi-token').then(GST => {
      getValue('stepn').then(GMT => {
        getValue('solana').then(SOL => {
          let done = Object.keys(mintValues).every(value => {
            let key = value
            let gstAmount = parseInt(value.split("-")[0].trim())
            let gmtAmount = parseInt(value.split("-")[1].trim())

            mintValuesUpdated[key].eur = GST.market_data.current_price["eur"] * gstAmount + GMT.market_data.current_price["eur"] * gmtAmount
            mintValuesUpdated[key].sol = mintValuesUpdated[key].eur / SOL.market_data.current_price["eur"]

            return true
          })

          if (done) {
            levelCostUpdated[5].eur = GST.market_data.current_price["eur"] * 20 + GMT.market_data.current_price["eur"] * 10
            levelCostUpdated[5].sol = levelCostUpdated[5].eur / SOL.market_data.current_price["eur"]

            setLevelCost(levelCostUpdated)
            setMintValues(mintValuesUpdated)
            setCurrentGstUsdPrice(GST.market_data.current_price["usd"])
          }

        })
      })
    })
  }

  const setValuesFromConversion = (main, amount) => {
    let allValuesUpdated = { ...allValues };
    if (cryptoIdList.includes(main)) {
      getValue(main).then(data => {
        getValue(cryptoIdList[0]).then(currentCrypto0 => {
          getValue(cryptoIdList[1]).then(currentCrypto1 => {
            getValue(cryptoIdList[2]).then(currentCrypto2 => {
              allValuesUpdated[cryptoIdList[0]] = (data.market_data.current_price["eur"] / currentCrypto0.market_data.current_price["eur"]) * amount
              allValuesUpdated[cryptoIdList[1]] = (data.market_data.current_price["eur"] / currentCrypto1.market_data.current_price["eur"]) * amount
              allValuesUpdated[cryptoIdList[2]] = (data.market_data.current_price["eur"] / currentCrypto2.market_data.current_price["eur"]) * amount

              allValuesUpdated.eur = data.market_data.current_price["eur"] * amount
              allValuesUpdated.usd = data.market_data.current_price["usd"] * amount

              //console.log(allValuesUpdated)
              setAllValues(allValuesUpdated)
            })
          })
        })
      })
    } else {
      getValue(cryptoIdList[0]).then(currentCrypto0 => {
        getValue(cryptoIdList[1]).then(currentCrypto1 => {
          getValue(cryptoIdList[2]).then(currentCrypto2 => {
            allValuesUpdated[cryptoIdList[0]] = amount / currentCrypto0.market_data.current_price[main]
            allValuesUpdated[cryptoIdList[1]] = amount / currentCrypto1.market_data.current_price[main]
            allValuesUpdated[cryptoIdList[2]] = amount / currentCrypto2.market_data.current_price[main]

            let rateo = currentCrypto0.market_data.current_price['usd'] / currentCrypto0.market_data.current_price["eur"]
            if (main === 'eur') {
              allValuesUpdated.eur = amount
              allValuesUpdated.usd = amount * rateo
            }
            else if (main === 'usd') {
              allValuesUpdated.eur = amount / rateo
              allValuesUpdated.usd = amount
            }
            //console.log(allValuesUpdated)
            setAllValues(allValuesUpdated)
          })
        })
      })
    }
  }

  function customRound(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100
  }


  function CardMinting() {
    updateMintStats();
    let key;
    let message;
    let price = currentGstUsdPrice;
    switch (true) {
      case (price < 2):
        key = "200-0"
        message = "GST lower than 2 USD"
        break;
      case (price < 3):
        key = "160-40"
        message = "GST between 2 and 3 USD"
        break;
      case (price < 4):
        key = "120-80"
        message = "GST between 3 and 4 USD"
        break;
      case (price < 8):
        key = "100-100"
        message = "GST between 4 and 8 USD"
        break;
      case (price < 10):
        key = "80-120"
        message = "GST between 8 and 10 USD"
        break;
      case (price > 10):
        key = "40-160"
        message = "GST higher than 10 USD"
        break;
      default:
        key = "Error"
        break;
    }

    let gstAmount = key.split('-')[0].trim()
    let gmtAmount = key.split('-')[1].trim()
    return <Card className="mx-auto m-4">
      <Card.Header as="h5">Is minting worth?</Card.Header>
      <Card.Body>
        {
          price ?
            <div>
              <small className="text-muted">{message} - {price} $</small>
              <h5 className="mt-1">{key} + level5 = <b>{customRound(mintValues[key].eur + levelCost[5].eur)}€</b> = <b>{customRound(mintValues[key].sol + levelCost[5].sol)}SOL</b></h5>
              <b>Mint</b>: {gstAmount}GST+{gmtAmount}GMT = <b>{customRound(mintValues[key].eur)}€</b> = <b>{customRound(mintValues[key].sol)}SOL</b><br />
              <b>Level5</b>: 20GST+10GMT = <b>{customRound(levelCost[5].eur)}€</b> = <b>{customRound(levelCost[5].sol)}SOL</b><br />
            </div>
            : <div className="d-flex justify-content-center">
              <div className="spinner-border" role="status">
              </div>
            </div>
        }
        <br />
      </Card.Body>
    </Card>
  }

  useState(() => {
    updateMintStats();
    handleChangeText('green-satoshi-token', 19);
  }, [])

  return <>
    <Navbar bg="primary" variant="dark">
      <Container>
        <Navbar.Brand>
          <img
            alt=""
            src={logo}
            width="50"
            height="50"
            className="d-inline-block"
          />{' '}
          Simple real time crypto converter
        </Navbar.Brand>
      </Container>
    </Navbar>
    <div className="mx-auto row mainContainer">
      <div className="col-lg">
        <Card className="mx-auto m-4">
          <Card.Header as="h5">Real time converter</Card.Header>
          <Card.Body>
            <Card.Title className="mb-3">Select your crypto or change them</Card.Title>
            <div className="row">
              {
                cryptoIdList.map((value, index) => {
                  return <div key={'crypto' + index} className="col-lg mb-3">
                    <InputGroup>
                      <Button variant="outline-primary">{symbols[value]}</Button>
                      <FormControl placeholder="insert" value={allValues[value] || ''} onChange={(e) => handleChangeText(value, e.target.value)} />
                    </InputGroup>
                  </div>
                })
              }
              <hr />
              {
                fiatIdList.map((value, index) => {
                  return <div key={'fiat' + index} className="col-lg mb-3">
                    <InputGroup>
                      <Button variant="outline-primary">{value.toUpperCase()}</Button>
                      <FormControl placeholder="insert" value={allValues[value] || ''} onChange={(e) => handleChangeText(value, e.target.value)} />
                    </InputGroup>
                  </div>
                })
              }

            </div>
          </Card.Body>
        </Card>
      </div>
      <div className="col-lg">
        <CardMinting />
      </div>
    </div>



  </>
}

export default App;
