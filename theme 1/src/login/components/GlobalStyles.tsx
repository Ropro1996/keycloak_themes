import { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle`
    html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100vh;
        background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
        color: #fff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        overflow: hidden; /* Prevent scrollbars completely */
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
    }

    .login-pf body {
        background: none;
    }

    /* Hide the default Keycloak header */
    #kc-header {
        display: none;
    }

    #kc-header-wrapper {
        display: none;
    }

    .login-pf-page .card-pf {
        background: transparent;
        box-shadow: none;
        border: none;
    }

    /* Hide language selector completely */
    #kc-locale,
    #kc-locale-wrapper,
    #kc-locale-dropdown,
    .kcLocaleMainClass,
    .kcLocaleWrapperClass,
    .kcLocaleDropDownClass,
    .kcLocaleListClass,
    .kcLocaleListItemClass,
    .kcLocaleItemClass {
        display: none !important;
    }

    .alert-error {
        background-color: rgba(220, 53, 69, 0.8);
        border-color: rgba(220, 53, 69, 0.5);
        color: #fff;
        border-radius: 5px;
        padding: 10px 15px;
        margin-bottom: 20px;
        font-size: 14px;
    }

    .alert-warning {
        background-color: rgba(255, 193, 7, 0.8);
        border-color: rgba(255, 193, 7, 0.5);
        color: #212529;
        border-radius: 5px;
        padding: 10px 15px;
        margin-bottom: 20px;
        font-size: 14px;
    }

    .alert-success {
        background-color: rgba(40, 167, 69, 0.8);
        border-color: rgba(40, 167, 69, 0.5);
        color: #fff;
        border-radius: 5px;
        padding: 10px 15px;
        margin-bottom: 20px;
        font-size: 14px;
    }

    .alert-info {
        background-color: rgba(23, 162, 184, 0.8);
        border-color: rgba(23, 162, 184, 0.5);
        color: #fff;
        border-radius: 5px;
        padding: 10px 15px;
        margin-bottom: 20px;
        font-size: 14px;
    }

    /* Feedback icons */
    .kcFeedbackErrorIcon {
        display: inline-block;
        width: 16px;
        height: 16px;
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23fff'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z'/%3E%3C/svg%3E") no-repeat center center;
        background-size: contain;
        margin-right: 8px;
    }

    .kcFeedbackWarningIcon {
        display: inline-block;
        width: 16px;
        height: 16px;
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23212529'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z'/%3E%3C/svg%3E") no-repeat center center;
        background-size: contain;
        margin-right: 8px;
    }

    .kcFeedbackSuccessIcon {
        display: inline-block;
        width: 16px;
        height: 16px;
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23fff'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/%3E%3C/svg%3E") no-repeat center center;
        background-size: contain;
        margin-right: 8px;
    }

    .kcFeedbackInfoIcon {
        display: inline-block;
        width: 16px;
        height: 16px;
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23fff'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'/%3E%3C/svg%3E") no-repeat center center;
        background-size: contain;
        margin-right: 8px;
    }

    /* Canvas background */
    canvas {
        position: fixed;
        top: 0;
        left: 0;
        z-index: -1;
    }

    /* Hide the page title since we're using our own */
    #kc-page-title {
        display: none;
    }
    
    /* Hide registration elements and info sections */
    #kc-registration,
    .kc-registration,
    #kc-info,
    .kc-info,
    .kcSignUpClass,
    .kcInfoAreaWrapperClass {
        display: none !important;
    }
    
    /* Hide any registration links that might be added by Keycloak */
    a[href*="registration"],
    a[href*="register"] {
        display: none !important;
    }
    
    /* Remove any empty spaces that might be caused by hidden elements */
    .kcFormCardClass {
        margin-bottom: 0 !important;
    }
    
    /* Ensure no white boxes appear at the bottom */
    #kc-form {
        margin-bottom: 0 !important;
    }
    
    /* Responsive layout styles */
    .kcLoginClass {
        display: flex;
        flex-direction: column;
        height: 100vh;
        width: 100%;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        overflow: hidden;
    }
    
    .kcFormCardClass {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }
    
    #kc-content {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
    }
    
    #kc-content-wrapper {
        width: 100%;
        max-width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
    
    /* Ensure form is always visible without scrolling */
    #kc-form {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        overflow: hidden;
    }
    
    /* Input focus styles */
    input:focus {
        outline: none;
        border-color: #4a90e2 !important;
        box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.25) !important;
    }
    
    /* Button hover effect */
    button:hover {
        transform: translateY(-1px);
        background: linear-gradient(135deg, #5a9ee2, #3573eb) !important;
    }
    
    /* Media queries for responsive design */
    @media (max-width: 767px) {
        #kc-form-wrapper {
            padding: 0 15px;
            max-height: 100vh;
            max-width: 100% !important;
        }
        
        /* Adjust font sizes for smaller screens */
        h2 {
            font-size: 18px !important;
        }
        
        /* Make inputs and buttons slightly smaller on mobile */
        input, button {
            padding: 10px 15px !important;
            height: 45px !important;
        }
        
        /* Adjust form container padding on mobile */
        #kc-form-login > div {
            padding: 20px !important;
        }
    }
    
    /* Medium screens */
    @media (min-width: 768px) and (max-width: 991px) {
        #kc-form-wrapper {
            max-width: 28rem !important;
        }
    }
    
    /* Large screens */
    @media (min-width: 992px) {
        #kc-form-wrapper {
            max-width: 30rem !important;
        }
    }
`;