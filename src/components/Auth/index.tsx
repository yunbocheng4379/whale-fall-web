import {getToken} from "@/utils/tokenUtil";
import {Navigate} from "@umijs/max";
import React from "react";
import {LOGIN_PATH} from "@/config";

export const withAuth = (Component: React.FC) => () => {
  if (getToken()) {
    return <Component/>;
  } else {
    return <Navigate to={LOGIN_PATH}/>;
  }
};
