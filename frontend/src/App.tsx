import React, { useEffect, useContext, useCallback, useMemo } from "react";

import Header from "./Components/Headers";
import Products from "./Components/ProductTypes/Products";
import Items from "./Components/ProductTypes/Items";
import Context from "./Context";
import CapRate from "./Components/CapRate/CapRate";

import styles from "./App.module.css";

const App = () => {
  const { linkSuccess, isPaymentInitiation, itemId, dispatch } =
    useContext(Context);

  // That Simple — client-side view router via ?view=...
  // Default (root) view is the Cap Rate calculator (the user-facing app).
  // The legacy Plaid Quickstart demo is preserved at ?view=plaid-demo for testing.
  const view = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("view") || "";
  }, []);
  const isPlaidDemoView = view === "plaid-demo";
  const isCapRateView = !isPlaidDemoView;

  const getInfo = useCallback(async () => {
    const response = await fetch("/api/info", { method: "POST" });
    if (!response.ok) {
      dispatch({ type: "SET_STATE", state: { backend: false } });
      return { paymentInitiation: false };
    }
    const data = await response.json();
    const paymentInitiation: boolean =
      data.products.includes("payment_initiation");
    dispatch({
      type: "SET_STATE",
      state: {
        products: data.products,
        isPaymentInitiation: paymentInitiation,
      },
    });
    return { paymentInitiation };
  }, [dispatch]);

  const generateToken = useCallback(
    async (isPaymentInitiation: boolean) => {
      const path = isPaymentInitiation
        ? "/api/create_link_token_for_payment"
        : "/api/create_link_token";
      const response = await fetch(path, { method: "POST" });
      if (!response.ok) {
        dispatch({ type: "SET_STATE", state: { linkToken: null } });
        return;
      }
      const data = await response.json();
      if (data) {
        if (data.error != null) {
          dispatch({
            type: "SET_STATE",
            state: { linkToken: null, linkTokenError: data.error },
          });
          return;
        }
        dispatch({ type: "SET_STATE", state: { linkToken: data.link_token } });
      }
      localStorage.setItem("link_token", data.link_token);
    },
    [dispatch]
  );

  const generateUserToken = useCallback(async () => {
    const response = await fetch("/api/create_user_token", { method: "POST" });
    if (!response.ok) {
      dispatch({ type: "SET_STATE", state: { userToken: null } });
      return;
    }
    const data = await response.json();
    if (data) {
      if (data.error != null) {
        dispatch({ type: "SET_STATE", state: { userToken: null } });
        return;
      }
      dispatch({ type: "SET_STATE", state: { userToken: data.user_token } });
    }
  }, [dispatch]);

  useEffect(() => {
    if (!isPlaidDemoView) return; // Skip Plaid init on the calculator route
    const init = async () => {
      const { paymentInitiation } = await getInfo();
      if (window.location.href.includes("?oauth_state_id=")) {
        dispatch({
          type: "SET_STATE",
          state: { linkToken: localStorage.getItem("link_token") },
        });
        return;
      }
      const isUserTokenFlow = process.env.REACT_APP_USER_TOKEN === "true";
      if (isUserTokenFlow) {
        await generateUserToken();
      }
      generateToken(paymentInitiation);
    };
    init();
  }, [dispatch, generateToken, generateUserToken, getInfo, isPlaidDemoView]);

  if (isCapRateView) {
    return <CapRate />;
  }

  return (
    <div className={styles.App}>
      <div className="absolute top-4 right-6 text-sm">
        <a href="/" className="text-blue-600 hover:underline">← Back to Cap Rate</a>
      </div>
      <div className={styles.container}>
        <Header />
        {linkSuccess && (
          <>
            {!isPaymentInitiation && itemId && <Items />}
          </>
        )}
        <Products />
      </div>
    </div>
  );
};

export default App;
