import { Request, Response, Router } from 'express'
import HttpStatus from 'http-status'

export const healthRouter = Router()

healthRouter.get('/', (req: Request, res: Response) => {
    return res.status(HttpStatus.OK).json({
        status: 'ok',
        time: new Date().toISOString()
    })
})