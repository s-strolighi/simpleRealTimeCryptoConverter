import { useState } from "react";
import { Navbar, Container, Card, InputGroup, FormControl, Button } from "react-bootstrap";
import logo from './logo512.png';

const App = () => {


  const url = "https://api.coingecko.com/api/v3/coins/"

  const cryptoIdList = ["green-satoshi-token", "stepn", "solana"]
  const fiatIdList = ["eur", "usd"]

  const [allValues, setAllValues] = useState({})


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

  const setValuesFromConversion = (main, amount) => {
    let allValuesUpdated = { ...allValues };
    if(cryptoIdList.includes(main)){
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
    }else{
      getValue(cryptoIdList[0]).then(currentCrypto0 => {
        getValue(cryptoIdList[1]).then(currentCrypto1 => {
          getValue(cryptoIdList[2]).then(currentCrypto2 => {
            allValuesUpdated[cryptoIdList[0]] = amount / currentCrypto0.market_data.current_price[main]
            allValuesUpdated[cryptoIdList[1]] = amount / currentCrypto1.market_data.current_price[main]
            allValuesUpdated[cryptoIdList[2]] = amount / currentCrypto2.market_data.current_price[main]
            
            let rateo = currentCrypto0.market_data.current_price['usd'] / currentCrypto0.market_data.current_price["eur"]
            if(main === 'eur'){
              allValuesUpdated.eur = amount
              allValuesUpdated.usd = amount*rateo
            }
            else if(main === 'usd'){
              allValuesUpdated.eur = amount/rateo
              allValuesUpdated.usd = amount
            }            
            //console.log(allValuesUpdated)
            setAllValues(allValuesUpdated)
          })
        })
      })
    }
  }

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

    <Card className="mx-auto m-4" style={{ "width": "70vw" }}>
      <Card.Header as="h5">Real time converter</Card.Header>
      <Card.Body>
        <Card.Title className="mb-3">Select your crypto or change them</Card.Title>
        <div className="row">
          {
            cryptoIdList.map((value, index) => {
              return <div key={'crypto' + index} className="col-lg mb-3">
                <InputGroup>
                  <Button variant="outline-primary">{value}</Button>
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
                  <Button variant="outline-primary">{value}</Button>
                  <FormControl type='number' placeholder="insert" value={allValues[value] || ''} onChange={(e) => handleChangeText(value, e.target.value)} />
                </InputGroup>
              </div>
            })
          }

        </div>
      </Card.Body>
    </Card>

  </>
}

export default App;
