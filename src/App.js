import { useEffect, useState } from "react";
import { Navbar, Container, Card, InputGroup, FormControl, Button, Form, Dropdown, DropdownButton } from "react-bootstrap";
import logo from './logo512.png';

const App = () => {

  const url = "https://api.coingecko.com/api/v3/coins/"
  const dailyGstValue = 28

  const cryptoIdList = ["green-satoshi-token", "stepn", "solana"]
  const fiatIdList = ["eur", "usd"]
  const [currentGstUsdPrice, setCurrentGstUsdPrice] = useState(0)
  const [currentMintKey, setCurrentMintKey] = useState(null)

  const symbols = { 'green-satoshi-token': 'GST', 'stepn': 'GMT', 'solana': 'SOL' }
  const [symbolsValue, setSymbolsValue] = useState({
    'green-satoshi-token': { eur: 0, usd: 0 },
    'stepn': { eur: 0, usd: 0 },
    'solana': { eur: 0, usd: 0 }
  });
  const [usdEurRateo, setUsdEurRateo] = useState(0)

  const [allValues, setAllValues] = useState({})
  const [mintValues, setMintValues] = useState({
    "200/0": { "eur": 0, "sol": 0 },
    "160/40": { "eur": 0, "sol": 0 },
    "120/80": { "eur": 0, "sol": 0 },
    "100/100": { "eur": 0, "sol": 0 },
    "80/120": { "eur": 0, "sol": 0 },
    "40/160": { "eur": 0, "sol": 0 }
  })
  const [levelCost, setLevelCost] = useState({ "5": { "eur": 0, "sol": 0 } })

  const updatePeriodicallySymbolsValues = () => {
    setInterval(updateSymbolsValues, 15 * 1000)
  }

  const updateSymbolsValues = (init = false) => {
    let symbolsValueUpdated = symbolsValue;
    let usdEurRateoUpdated = usdEurRateo;
    getValue(cryptoIdList[0]).then(GST => {
      getValue(cryptoIdList[1]).then(GMT => {
        getValue(cryptoIdList[2]).then(SOL => {
          symbolsValueUpdated["green-satoshi-token"].eur = GST.market_data.current_price["eur"]
          symbolsValueUpdated["green-satoshi-token"].usd = GST.market_data.current_price["usd"]

          symbolsValueUpdated["stepn"].eur = GMT.market_data.current_price["eur"]
          symbolsValueUpdated["stepn"].usd = GMT.market_data.current_price["usd"]

          symbolsValueUpdated["solana"].eur = SOL.market_data.current_price["eur"]
          symbolsValueUpdated["solana"].usd = SOL.market_data.current_price["usd"]

          usdEurRateoUpdated = symbolsValueUpdated["solana"].usd / symbolsValueUpdated["solana"].eur

          setSymbolsValue(symbolsValueUpdated);
          setUsdEurRateo(usdEurRateoUpdated);
          updateMintStats();
          if (init)
            handleChangeText('green-satoshi-token', dailyGstValue);
        })
      })
    })
  }

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

  const handleChangeText = (symbol, amount) => {
    let allValuesUpdated = { ...allValues };
    allValuesUpdated[symbol] = amount;
    let done;

    if (cryptoIdList.includes(symbol)) {
      done = cryptoIdList.every(key => {
        if (key !== symbol)
          allValuesUpdated[key] = (symbolsValue[symbol].eur / symbolsValue[key].eur) * parseFloat(amount)

        return true;
      })

      if (done) {
        allValuesUpdated.eur = symbolsValue[symbol].eur * parseFloat(amount)
        allValuesUpdated.usd = symbolsValue[symbol].usd * parseFloat(amount)
      }
    }
    else {
      done = cryptoIdList.every(key => {
        allValuesUpdated[key] = parseFloat(amount) / symbolsValue[key][symbol]
        return true;
      })
      if (done) {
        if (symbol === 'eur') {
          allValuesUpdated.eur = amount
          allValuesUpdated.usd = amount * usdEurRateo
        }
        else if (symbol === 'usd') {
          allValuesUpdated.eur = amount / usdEurRateo
          allValuesUpdated.usd = amount
        }
      }
    }
    if (done)
      setAllValues(allValuesUpdated)
  }

  const updateMintStats = () => {
    let mintValuesUpdated = mintValues;
    let levelCostUpdated = levelCost;

    let done = Object.keys(mintValues).every(value => {
      let key = value
      let gstAmount = parseInt(value.split("/")[0].trim())
      let gmtAmount = parseInt(value.split("/")[1].trim())

      mintValuesUpdated[key].eur = symbolsValue["green-satoshi-token"].eur * gstAmount + symbolsValue["stepn"].eur * gmtAmount
      mintValuesUpdated[key].sol = mintValuesUpdated[key].eur / symbolsValue["solana"].eur

      return true
    })

    if (done) {
      levelCostUpdated[5].eur = symbolsValue["green-satoshi-token"].eur * 20 + symbolsValue["stepn"].eur * 10
      levelCostUpdated[5].sol = levelCostUpdated[5].eur / symbolsValue["solana"].eur

      setLevelCost(levelCostUpdated)
      setMintValues(mintValuesUpdated)
      setCurrentGstUsdPrice(symbolsValue["green-satoshi-token"].usd)
    }

  }

  function customRound(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100
  }

  function CardMinting() {
    let mintKey;
    let message;
    let price = currentGstUsdPrice;
    switch (true) {
      case (price < 2):
        mintKey = currentMintKey || "200/0"
        message = "GST lower than 2 USD"
        break;
      case (price < 3):
        mintKey = currentMintKey || "160/40"
        message = "GST between 2 and 3 USD"
        break;
      case (price < 4):
        mintKey = currentMintKey || "120/80"
        message = "GST between 3 and 4 USD"
        break;
      case (price < 8):
        mintKey = currentMintKey || "100/100"
        message = "GST between 4 and 8 USD"
        break;
      case (price < 10):
        mintKey = currentMintKey || "80/120"
        message = "GST between 8 and 10 USD"
        break;
      case (price >= 10):
        mintKey = currentMintKey || "40/160"
        message = "GST higher than 10 USD"
        break;
      default:
        mintKey = currentMintKey || "Error"
        break;
    }

    let gstAmount = mintKey.split('/')[0].trim()
    let gmtAmount = mintKey.split('/')[1].trim()
    let totalSolPrice = customRound(mintValues[mintKey].sol + levelCost[5].sol)
    let totalEurPrice = customRound(mintValues[mintKey].eur + levelCost[5].eur)
    return <Card className="mx-auto m-4">
      <Card.Header as="h5">
        <div className="row">
          <div className="col col-lg-4">
            Is minting worth?

          </div>
          <div className="col col-lg-4">
            <DropdownButton title={gstAmount+"GST+"+gmtAmount+"GMT"} size="sm">
              <Dropdown.Item as="button" onClick={() => setCurrentMintKey("200/0")}><b>{200}</b>GST+<b>{0}</b>GMT {"(GST < 2$)"}</Dropdown.Item>
              <Dropdown.Item as="button" onClick={() => setCurrentMintKey("160/40")}><b>{160}</b>GST+<b>{40}</b>GMT {"(GST 2-3$)"}</Dropdown.Item>
              <Dropdown.Item as="button" onClick={() => setCurrentMintKey("120/80")}><b>{120}</b>GST+<b>{80}</b>GMT {"(GST 3-4$)"}</Dropdown.Item>
              <Dropdown.Item as="button" onClick={() => setCurrentMintKey("100/100")}><b>{100}</b>GST+<b>{100}</b>GMT {"(GST 4-8$)"}</Dropdown.Item>
              <Dropdown.Item as="button" onClick={() => setCurrentMintKey("80/120")}><b>{80}</b>GST+<b>{120}</b>GMT {"(GST 8-10$)"}</Dropdown.Item>
              <Dropdown.Item as="button" onClick={() => setCurrentMintKey("40/160")}><b>{40}</b>GST+<b>{160}</b>GMT {"(GST > 10$)"}</Dropdown.Item>

            </DropdownButton>
          </div>
        </div>

      </Card.Header>
      <Card.Body>
        {
          price ?
            <div>
              <small className="text-muted">{message} - {price} $</small>
              <h5 className="mt-1">{mintKey} + level5 = <b>{totalEurPrice}€</b> = <b>{totalSolPrice}SOL</b></h5>
              <small className="text-muted">{"(floor price including 6% fee)"}</small><br />
              <h5>Sell price = <b>{customRound(totalEurPrice / 0.94)}€</b> = <b>{customRound(totalSolPrice / 0.94)}SOL</b></h5><br />
              <b>Mint</b>: {gstAmount}GST+{gmtAmount}GMT = <b>{customRound(mintValues[mintKey].eur)}€</b> = <b>{customRound(mintValues[mintKey].sol)}SOL</b><br />
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

  useEffect(() => {
    updateSymbolsValues(true)
    updatePeriodicallySymbolsValues();
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
          Simple STEP'N helper tool
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
