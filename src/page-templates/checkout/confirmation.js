import React, { useEffect, useState } from "react"
import styled from "styled-components"
import is from "styled-is"

import { useLocation, navigate } from "@reach/router"

import Layout from "components/layout"
import { useBasket } from "components/basket"
import OrderItems from "components/order-items"
import { H1, H3, Outer, Header } from "ui"
import { useT } from "lib/i18n"
import ServiceApi from "lib/service-api.js"

import BillingDetails from "./billing-details"

const CustomHeader = styled(Header)`
  margin-bottom: 0;
  padding-bottom: 0;
`

const Line = styled.div`
  margin: 20px 0;
  border-bottom: 1px solid var(--color-main-background);
`

const Totals = styled.div`
  margin: 10px 15px;
`

const TotalLine = styled.div`
  text-align: right;
  margin-top: 5px;

  ${is("bold")`
    font-size: 1.2rem;
    font-weight: 600;
  `};
`

export default function Confirmation(props) {
  const basket = useBasket()
  const t = useT()
  const router = useLocation()
  const orderId = router.pathname.substring(
    router.pathname.lastIndexOf("/") + 1
  )
  const [order, setOrder] = useState()
  // Empty the basket
  useEffect(() => {
    if (router.search) {
      if (router.search === "?emptyBasket") {
        basket.actions.empty()

        const url = new URL(router.href)

        url.searchParams.delete("emptyBasket")

        navigate(router.pathname, { replace: true })
      }
    }
  })

  useEffect(() => {
    async function getDetails() {
      const response = await ServiceApi({
        query: `
          {
            orders {
              get(id: "${orderId}")
            }
          }
        `,
      })
      setOrder(response.data.orders.get)
    }
    getDetails()
  }, [])

  useEffect(() => {
    if (!order) {
      const t = setTimeout(() => window.location.reload(), 5000)

      return () => clearTimeout(t)
    }
  }, [order])

  if (!order) {
    return <Layout loading />
  }

  const cart = order.cart.map((item) => ({
    ...item,
    image: {
      url: item.imageUrl,
    },
  }))
  const email = order.customer.addresses?.[0]?.email
  const { total } = order

  return (
    <Layout title={t("checkout.confirmation.title")}>
      <Outer>
        <CustomHeader>
          <H1>{t("checkout.confirmation.title")}</H1>
          <p>
            {t("checkout.confirmation.shortStatus", {
              context: email ? "withEmail" : null,
              email,
            })}
          </p>
          <Line />
          <BillingDetails order={order} />
          <Line />
          <H3>{t("order:item", { count: cart.length })}</H3>
          <OrderItems cart={cart} />
          <Totals>
            <TotalLine bold>
              {t("basket.totalPrice")}:{" "}
              {t("common.price", {
                value: total.gross,
                currency: total.currency,
              })}
            </TotalLine>
            <TotalLine>
              {t("common.tax", {
                value: total.gross - total.net,
                currency: total.currency,
              })}
            </TotalLine>
          </Totals>
        </CustomHeader>
      </Outer>
    </Layout>
  )
}
