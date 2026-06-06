import { Router } from 'express'
import { getPaymentConfig } from '../services/whishPay.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const paymentsRouter = Router()

paymentsRouter.get('/config', (_req, res) => {
  sendSuccess(res, getPaymentConfig())
})
