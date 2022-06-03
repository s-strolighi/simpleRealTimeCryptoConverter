import { useEffect, useState } from "react";
import { Navbar, Container, Card, InputGroup, FormControl, Button, Row, Dropdown, DropdownButton, Col, Form, ProgressBar } from "react-bootstrap";
import logo from './logo512.png';

const App = () => {

  const url = "https://api.coingecko.com/api/v3/simple/price?ids="
  const dailyIncome = {
    'green-satoshi-token': 18,
    'green-satoshi-token-bsc': 19
  }


  const [totalEurDailyIncome, setTotalEurDailyIncome] = useState(0)

  const earnedDay = '05/30/2022' // MM/DD/YYY
  const diffTime = Math.abs(new Date() - new Date(earnedDay)); //differenza di giorni tra il giorno corrente e il giorno dell'ultimo ritiro
  const diffDays = parseInt(Math.ceil(diffTime / (1000 * 60 * 60 * 24))); //converto la differnza in giorni


  const eurSpesi = 1400 * 4 //totale investimento
  const eurRitirati = (536) * 4
  const eurProntiRitiro = totalEurDailyIncome * diffDays
  const eurPrevisione = eurRitirati + eurProntiRitiro // calcolo se ritirassi adesso i soldi in sospeso dall'ultimo ritiro
  const eurPercRitirati = customRound((eurPrevisione / eurSpesi) * 100)

  const roi = parseInt((eurSpesi - eurPrevisione) / totalEurDailyIncome)
  const roiDate = new Date(new Date().setDate(new Date().getDate() + roi))
  const roiDateFormat = roiDate.toLocaleDateString("it");

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
  const levelCumulativeCost = {
    0: { gst: 0, gmt: 0 },
    1: { gst: 1, gmt: 0 },
    2: { gst: 3, gmt: 0 },
    3: { gst: 6, gmt: 0 },
    4: { gst: 10, gmt: 0 },
    5: { gst: 20, gmt: 10 },
    6: { gst: 26, gmt: 10 },
    7: { gst: 33, gmt: 10 },
    8: { gst: 41, gmt: 10 },
    9: { gst: 50, gmt: 10 },
    10: { gst: 80, gmt: 40 },
    11: { gst: 91, gmt: 40 },
    12: { gst: 103, gmt: 40 },
    13: { gst: 116, gmt: 40 },
    14: { gst: 130, gmt: 40 },
    15: { gst: 145, gmt: 40 },
    16: { gst: 161, gmt: 40 },
    17: { gst: 178, gmt: 40 },
    18: { gst: 196, gmt: 40 },
    19: { gst: 215, gmt: 40 },
    20: { gst: 275, gmt: 100 },
    21: { gst: 296, gmt: 100 },
    22: { gst: 318, gmt: 100 },
    23: { gst: 341, gmt: 100 },
    24: { gst: 365, gmt: 100 },
    25: { gst: 390, gmt: 100 },
    26: { gst: 416, gmt: 100 },
    27: { gst: 443, gmt: 100 },
    28: { gst: 471, gmt: 100 },
    29: { gst: 500, gmt: 129 },
    30: { gst: 600, gmt: 229 },
  }

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
        if (init) {
          let totalEurDailyIncome = symbolsValueUpdated['green-satoshi-token'].eur * dailyIncome['green-satoshi-token'] + symbolsValueUpdated['green-satoshi-token-bsc'].eur * dailyIncome['green-satoshi-token-bsc']
          setTotalEurDailyIncome(totalEurDailyIncome)
          handleChangeText('solana', (totalEurDailyIncome / symbolsValueUpdated['solana'].eur));
        }
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

    let done = Object.keys(mintValues).every(value => {
      let key = value
      let gstAmount = parseInt(value.split("/")[0].trim())
      let gmtAmount = parseInt(value.split("/")[1].trim())

      mintValuesUpdated[key].eur = symbolsValue["green-satoshi-token"].eur * gstAmount + symbolsValue["stepn"].eur * gmtAmount
      mintValuesUpdated[key].sol = mintValuesUpdated[key].eur / symbolsValue["solana"].eur

      return true
    })

    if (done) {
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
    const [customLevelActive, setCustomLevelActive] = useState(false)
    const toggleCustomLevelActive = () => {
      setCustomLevelActive(!customLevelActive)
      setCustomLevelFrom(0)
      setCustomLevelTo(5)
    }
    const [customLevelFrom, setCustomLevelFrom] = useState(0)
    const [customLevelTo, setCustomLevelTo] = useState(5)

    let levelFrom = 0
    let levelTo = 5
    let customMintKey = mintKey
    if (currentMintKey === 'customMintKey') {
      customMintKey = customGstAmount || "0"
      customMintKey += '/'
      customMintKey += customGmtAmount || "0"
    }

    if (customLevelActive) {
      levelFrom = customLevelFrom
      levelTo = customLevelTo
    }

    let gstAmount = customMintKey.split('/')[0].trim()
    let gmtAmount = customMintKey.split('/')[1].trim()

    let customMintEurPrice = (symbolsValue['green-satoshi-token'].eur * parseFloat(gstAmount)) + (symbolsValue['stepn'].eur * parseFloat(gmtAmount))
    let customMintSolPrice = customMintEurPrice / symbolsValue['solana'].eur

    let customLevelUpEurPrice = (symbolsValue['green-satoshi-token'].eur * parseFloat(levelCumulativeCost[levelTo].gst - levelCumulativeCost[levelFrom].gst)) + (symbolsValue['stepn'].eur * parseFloat(levelCumulativeCost[levelTo].gmt - levelCumulativeCost[levelFrom].gmt))
    let customLevelUpSolPrice = customLevelUpEurPrice / symbolsValue['solana'].eur

    let customTotalEurPrice = customMintEurPrice + customLevelUpEurPrice
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
              <h5 className="mt-1"><b>Total</b> = {gstAmount}/{gmtAmount} + lvl {levelFrom}-{levelTo} = <b>{customRound(customTotalSolPrice)}SOL</b></h5>

              <br />
              <small className="text-muted">{"(floor price including 6% fee)"}</small><br />
              <h5>Sell price = <b>{customRound(customTotalSolPrice / 0.94)}SOL</b></h5><br />

              <b>Mint</b>: {gstAmount}GST+{gmtAmount}GMT = <b>{customRound(customMintEurPrice)}€</b> = <b>{customRound(customMintSolPrice)}SOL</b><br />
              <b>Level {levelFrom}-{levelTo}</b>: {levelCumulativeCost[levelTo].gst - levelCumulativeCost[levelFrom].gst}GST+{levelCumulativeCost[levelTo].gmt - levelCumulativeCost[levelFrom].gmt}GMT = <b>{customRound(customLevelUpEurPrice)}€</b> = <b>{customRound(customLevelUpSolPrice)}SOL</b><br />

              <br />
              <Form.Check
                type="switch"
                label="Custom level up range"
                onChange={toggleCustomLevelActive}
              />
              <Row xs={1} lg={2} className='mt-3'>
                <Col className="mb-3">
                  <InputGroup>
                    <Form.Label><b>Current: {levelFrom}</b></Form.Label>
                    <Form.Range
                      max={levelTo}
                      min={0}
                      step={1}
                      value={levelFrom}
                      onChange={(e) => setCustomLevelFrom(parseInt(e.target.value))}
                      disabled={!customLevelActive}
                    />
                  </InputGroup>
                </Col>
                <Col className="mb-3">
                  <InputGroup>
                    <Form.Label><b>Target: {levelTo}</b></Form.Label>
                    <Form.Range
                      max={30}
                      min={levelFrom}
                      step={1}
                      value={levelTo}
                      onChange={(e) => setCustomLevelTo(parseInt(e.target.value))}
                      disabled={!customLevelActive}
                    />
                  </InputGroup>
                </Col>
              </Row>

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
            <Card.Title className="mb-3">
              <small>
                Earning {dailyIncome["green-satoshi-token"]}GST + {dailyIncome["green-satoshi-token-bsc"]}GST(BSC) = {customRound(totalEurDailyIncome)}€
              </small>
            </Card.Title>

            <small>
              ROI = {roi} days ({roiDateFormat}) - earned <b>{parseInt(eurPrevisione/4)}€</b> each
            </small>
            <ProgressBar min={0} animated now={eurPrevisione} max={eurSpesi} label={parseInt(eurPrevisione)+'€ - '+eurPercRitirati+'%'}/>
            <div>
            <small className="float-left">
              {0}€
            </small>
            <small className="float-end">
              {eurSpesi}€
            </small>
            </div>

            <hr />
            <Row xs={1} lg={3} className='mt-4'>
              {
                cryptoIdList.slice(0, 3).map((value, index) => {
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
                cryptoIdList.slice(3, 5).map((value, index) => {
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
