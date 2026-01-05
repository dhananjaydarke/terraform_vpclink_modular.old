import { HashRouter, Routes, Route } from 'react-router-dom'

import 'bootstrap/dist/css/bootstrap.min.css'
import Health from './Views/Health.jsx'
import LIAT from './Views/LIAT.jsx'
import Portfolio from './Views/Portfolio.jsx'
import RITM from './Views/RITMs.jsx'
import Rolling from './Views/Rolling.jsx'
import RunbookTables from './Views/Runbooks.jsx'

function App() {
    return (
        <HashRouter>
            <Routes>
                <Route path='/' element={<Rolling />} />
                <Route path='/:id' element={<Portfolio />} />
                <Route path='/Health' element={<Health />} />
                <Route path='/LIAT' element={<LIAT />} />
                <Route path='/Runbooks/:id' element={<RunbookTables />} />
                <Route path='/RITM' element={<RITM />} />
            </Routes>
        </HashRouter>
    )
}

export default App
