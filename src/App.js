import { useState } from "react";
import { Navbar, Container, Card, InputGroup, FormControl, Button } from "react-bootstrap";
import logo from './logo512.png';

const App = () => {
  
  const url = "https://api.coingecko.com/api/v3/coins/"

  const cryptoIdList = ["green-satoshi-token", "stepn", "solana"]
  const fiatIdList = ["eur", "usd"]
  const symbols = { 'green-satoshi-token': 'GST', 'stepn': 'GMT', 'solana': 'SOL' }

  const [allValues, setAllValues] = useState({})
  const [mintValues, setMintValues] = useState({ "100": { "eur": 0, "sol": 0 }, "125": { "eur": 0, "sol": 0 } })
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
          mintValuesUpdated[100].eur = GST.market_data.current_price["eur"] * 100 + GMT.market_data.current_price["eur"] * 100
          mintValuesUpdated[125].eur = GST.market_data.current_price["eur"] * 125 + GMT.market_data.current_price["eur"] * 125

          mintValuesUpdated[100].sol = mintValuesUpdated[100].eur / SOL.market_data.current_price["eur"]
          mintValuesUpdated[125].sol = mintValuesUpdated[125].eur / SOL.market_data.current_price["eur"]

          levelCostUpdated[5].eur = GST.market_data.current_price["eur"] * 20 + GMT.market_data.current_price["eur"] * 10
          levelCostUpdated[5].sol = levelCostUpdated[5].eur / SOL.market_data.current_price["eur"]

          setLevelCost(levelCostUpdated)
          setMintValues(mintValuesUpdated)

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
    return <Card className="mx-auto m-4">
      <Card.Header as="h5">Is minting worth?</Card.Header>
      <Card.Body>
        <div className="row">
          <div className="col-lg mb-3">

            <h5>100/100 + level5 = <b>{customRound(mintValues[100].eur + levelCost[5].eur)}€</b> = <b>{customRound(mintValues[100].sol + levelCost[5].sol)}SOL</b></h5>
            <b>Mint</b>: 100GST+100GMT = <b>{customRound(mintValues[100].eur)}€</b> = <b>{customRound(mintValues[100].sol)}SOL</b><br />
            <b>Level5</b>: 20GST+10GMT = <b>{customRound(levelCost[5].eur)}€</b> = <b>{customRound(levelCost[5].sol)}SOL</b><br />

          </div>
        </div>
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
                      <FormControl type='number' placeholder="insert" value={allValues[value] || ''} onChange={(e) => handleChangeText(value, e.target.value)} />
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
                      <FormControl type='number' placeholder="insert" value={allValues[value] || ''} onChange={(e) => handleChangeText(value, e.target.value)} />
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
