import { useEffect, useState } from "react";
import { Navbar, Container, Card, InputGroup, FormControl, Button, Row, Dropdown, DropdownButton, Col } from "react-bootstrap";
import logo from './logo512.png';

const App = () => {

  const url = "https://api.coingecko.com/api/v3/simple/price?ids="
  const dailyGstValue = 39
  const apiRefreshTimer = 180 //seconds

  //crypto api code list
  const cryptoIdList = ["green-satoshi-token", "stepn", "solana", "green-satoshi-token-bsc", "binancecoin"]
  const fiatIdList = ["eur", "usd"]
  const [currentGstUsdPrice, setCurrentGstUsdPrice] = useState(0)
  const [currentMintKey, setCurrentMintKey] = useState(null)

  //crypto name
  const symbols = { 'green-satoshi-token': 'GST', 'stepn': 'GMT', 'solana': 'SOL', 'binancecoin': 'BNB', 'green-satoshi-token-bsc': 'GST(BSC)' }
  //crypto init value
  const [symbolsValue, setSymbolsValue] = useState({
    'green-satoshi-token': { eur: 0, usd: 0 },
    'stepn': { eur: 0, usd: 0 },
    'solana': { eur: 0, usd: 0 },
    'binancecoin': { eur: 0, usd: 0 },
    'green-satoshi-token-bsc': { eur: 0, usd: 0 }
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
    setInterval(updateSymbolsValues, apiRefreshTimer * 1000)
  }

  const updateSymbolsValues = (init = false) => {
    let symbolsValueUpdated = symbolsValue;
    let usdEurRateoUpdated = usdEurRateo;
    getValue(cryptoIdList).then(cryptos => {
      let done = cryptoIdList.every((currentCrypto) => {
        symbolsValueUpdated[currentCrypto].eur = cryptos[currentCrypto].eur
        symbolsValueUpdated[currentCrypto].usd = cryptos[currentCrypto].usd
        return true
      })

      if (done) {
        usdEurRateoUpdated = symbolsValueUpdated["solana"].usd / symbolsValueUpdated["solana"].eur

        setSymbolsValue(symbolsValueUpdated);
        setUsdEurRateo(usdEurRateoUpdated);
        updateMintStats();
        if (init)
          handleChangeText('green-satoshi-token', dailyGstValue);
      }
    })
  }

  const getValue = async (cryptos) => {
    cryptos = cryptos.join(',')
    return await fetch(url + cryptos + '&vs_currencies=eur,usd')
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
          allValuesUpdated.eur = parseFloat(amount)
          allValuesUpdated.usd = parseFloat(amount) * usdEurRateo
        }
        else if (symbol === 'usd') {
          allValuesUpdated.eur = parseFloat(amount) / usdEurRateo
          allValuesUpdated.usd = parseFloat(amount)
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
        mintKey = currentMintKey || null
        break;
    }

    const [customGstAmount, setCustomGstAmount] = useState(null)
    const [customGmtAmount, setCustomGmtAmount] = useState(null)

    let customMintKey = mintKey
    if (currentMintKey === 'customMintKey') {
      customMintKey = customGstAmount || "0"
      customMintKey += '/'
      customMintKey += customGmtAmount || "0"
    }
    let gstAmount = customMintKey.split('/')[0].trim()
    let gmtAmount = customMintKey.split('/')[1].trim()

    let customMintEurPrice = (symbolsValue['green-satoshi-token'].eur * parseFloat(gstAmount)) + (symbolsValue['stepn'].eur * parseFloat(gmtAmount))
    let customMintSolPrice = customMintEurPrice / symbolsValue['solana'].eur

    let customTotalEurPrice = customMintEurPrice + levelCost["5"].eur
    let customTotalSolPrice = customTotalEurPrice / symbolsValue['solana'].eur

    return <Card className="mx-auto m-4">
      <Card.Header as="h5">
        <div className="row">
          <div className="col col-lg-4">
            Is minting worth?
          </div>
          <div className="col col-lg-4">
            <DropdownButton title={gstAmount + "GST+" + gmtAmount + "GMT"} size="sm">
              <Dropdown.Item as="button" onClick={() => setCurrentMintKey("200/0")}><b>{200}</b>GST+<b>{0}</b>GMT {"(GST < 2$)"}</Dropdown.Item>
              <Dropdown.Item as="button" onClick={() => setCurrentMintKey("160/40")}><b>{160}</b>GST+<b>{40}</b>GMT {"(GST 2-3$)"}</Dropdown.Item>
              <Dropdown.Item as="button" onClick={() => setCurrentMintKey("120/80")}><b>{120}</b>GST+<b>{80}</b>GMT {"(GST 3-4$)"}</Dropdown.Item>
              <Dropdown.Item as="button" onClick={() => setCurrentMintKey("100/100")}><b>{100}</b>GST+<b>{100}</b>GMT {"(GST 4-8$)"}</Dropdown.Item>
              <Dropdown.Item as="button" onClick={() => setCurrentMintKey("80/120")}><b>{80}</b>GST+<b>{120}</b>GMT {"(GST 8-10$)"}</Dropdown.Item>
              <Dropdown.Item as="button" onClick={() => setCurrentMintKey("40/160")}><b>{40}</b>GST+<b>{160}</b>GMT {"(GST > 10$)"}</Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item as="button" onClick={() => setCurrentMintKey("customMintKey")}><b>Custom GST/GMT</b></Dropdown.Item>

            </DropdownButton>
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        {
          price ?
            <div>
              <div className="input-group input-group-sm mb-3" hidden={!(currentMintKey == "customMintKey")}>
                <div className="input-group-prepend">
                  <button className="btn btn-outline-primary btn-sm" type="button">GST/GMT</button>
                </div>
                <input type="text" className="form-control" id="customGstAmount" placeholder={"GST amount..."} value={customGstAmount || ''} inputMode='decimal' onChange={(e) => setCustomGstAmount(e.target.value?.replace(',', '.'))} />
                <input type="text" className="form-control" id="customGmtAmount" placeholder={"GMT amount..."} value={customGmtAmount || ''} inputMode='decimal' onChange={(e) => setCustomGmtAmount(e.target.value?.replace(',', '.'))} />
              </div>

              <small className="text-muted">{message} - {price} $</small>
              <h5 className="mt-1">{gstAmount}/{gmtAmount} + level5 = <b>{customRound(customTotalEurPrice)}€</b> = <b>{customRound(customTotalSolPrice)}SOL</b></h5>
              <small className="text-muted">{"(floor price including 6% fee)"}</small><br />
              <h5>Sell price = <b>{customRound(customTotalEurPrice / 0.94)}€</b> = <b>{customRound(customTotalSolPrice / 0.94)}SOL</b></h5><br />
              <b>Mint</b>: {gstAmount}GST+{gmtAmount}GMT = <b>{customRound(customMintEurPrice)}€</b> = <b>{customRound(customMintSolPrice)}SOL</b><br />
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
            <Card.Title className="mb-3">Convert crypto/fiat in real time</Card.Title>
            <Row xs={1} lg={3}>
              {
                cryptoIdList.slice(0,3).map((value, index) => {
                  return <Col key={'crypto' + index} className="mb-3">
                    <InputGroup>
                      <Button variant="outline-primary">{symbols[value]}</Button>
                      <FormControl type='text' placeholder="insert" value={allValues[value] || ''} inputMode='decimal' onChange={(e) => handleChangeText(value, e.target.value?.replace(',', '.'))} />
                    </InputGroup>
                  </Col>
                })
              }
            </Row>
            <hr />
            <Row xs={1} lg={2}>
              {
                cryptoIdList.slice(3,5).map((value, index) => {
                  return <Col key={'crypto' + index} className="mb-3">
                    <InputGroup>
                      <Button variant="outline-primary">{symbols[value]}</Button>
                      <FormControl type='text' placeholder="insert" value={allValues[value] || ''} inputMode='decimal' onChange={(e) => handleChangeText(value, e.target.value?.replace(',', '.'))} />
                    </InputGroup>
                  </Col>
                })
              }
            </Row>
            <hr />
            <Row xs={1} lg={2}>
              {
                fiatIdList.map((value, index) => {
                  return <Col key={'fiat' + index} className=" mb-3">
                    <InputGroup>
                      <Button variant="outline-primary">{value.toUpperCase()}</Button>
                      <FormControl placeholder="insert" value={allValues[value] || ''} onChange={(e) => handleChangeText(value, e.target.value)} />
                    </InputGroup>
                  </Col>
                })
              }
            </Row>
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