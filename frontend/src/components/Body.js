import Header from './Header'
import Main from './Main'
import Footer from './Footer'
import {useEffect, useState} from "react"

export default function Body({

}) {
    const [route, setRoute] = useState('world');

    return (
        <>
            <Header route={route} setRoute={setRoute} />
            <Main route={route} />
            <Footer />
        </>
    );
  }
  