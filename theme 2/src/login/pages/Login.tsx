import { useState, type FormEventHandler } from "react";
import { useConstCallback } from "keycloakify/tools/useConstCallback";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import { ThreeJsBackground } from "../components/ThreeJsBackground";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";

export default function Login(props: PageProps<Extract<KcContext, { pageId: "login.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { realm, url, login, auth } = kcContext;

    // Extract social providers from kcContext with default values
    const { social } = kcContext;
    const socialProviders = social?.providers || [];
    
    // Extract username hidden from kcContext
    const { usernameHidden = false } = kcContext;

    const { msg, msgStr } = i18n;

    const [isLoginButtonDisabled, setIsLoginButtonDisabled] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const onSubmit = useConstCallback<FormEventHandler<HTMLFormElement>>(e => {
        e.preventDefault();

        setIsLoginButtonDisabled(true);

        const formElement = e.target as HTMLFormElement;

        //NOTE: We can't use formElement.checkValidity() because it doesn't work with custom validation.
        //Checking if fields are empty is done by the backend, so we don't need to do it here.
        formElement.submit();
    });

    return (
        <Template
            {...{ kcContext, i18n, doUseDefaultCss, classes }}
            displayInfo={false}
            headerNode={null}
        >
            {/* Three.js animated background */}
            <ThreeJsBackground />
            
            <div id="kc-form" className={classes?.kcFormClass} style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                width: "100%",
                padding: "0",
                overflow: "hidden",
                position: "absolute",
                top: 0,
                left: 0
            }}>
                <div
                    id="kc-form-wrapper"
                    style={{
                        width: "100%",
                        maxWidth: "30rem", /* Similar to md:w-[30rem] */
                        padding: "0 20px",
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center"
                    }}>
                    {realm.password && (
                        <form
                            id="kc-form-login"
                            onSubmit={onSubmit}
                            action={url.loginAction}
                            method="post"
                            className={classes?.kcFormGroupClass}
                            style={{
                                width: "100%"
                            }}
                        >
                            {/* Modern card styling for the login form */}
                            <div style={{ 
                                background: "rgba(255, 255, 255, 0.05)", 
                                backdropFilter: "blur(16px)",
                                borderRadius: "12px",
                                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2), 0 0 1px rgba(255, 255, 255, 0.1)",
                                maxHeight: "calc(100vh - 40px)",
                                overflowY: "auto",
                                width: "100%",
                                boxSizing: "border-box",
                                border: "1px solid rgba(255, 255, 255, 0.1)"
                            }}>
                                {/* Header section with logo and title */}
                                <div style={{
                                    padding: "24px 24px 0 24px",
                                    textAlign: "center"
                                }}>
                                    {/* Organization Logo */}
                                    <div style={{
                                        textAlign: "center",
                                        marginBottom: "16px"
                                    }}>
                                        <div style={{
                                            fontSize: "32px",
                                            fontWeight: "bold",
                                            color: "#4a90e2",
                                            background: "-webkit-linear-gradient(45deg, #4a90e2, #63b3ed)",
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent",
                                            display: "inline-block",
                                            height: "64px", /* Similar to h-16 */
                                            lineHeight: "64px"
                                        }}>
                                            CSTECH.ai
                                        </div>
                                    </div>
                                    
                                    <h2 style={{ 
                                        textAlign: "center", 
                                        marginBottom: "24px",
                                        color: "#fff",
                                        fontSize: "20px",
                                        fontWeight: "600"
                                    }}>
                                        Sign In to Your Account
                                    </h2>
                                </div>
                                
                                {/* Form content */}
                                <div style={{
                                    padding: "0 24px 24px 24px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "24px"
                                }}>
                                    {!usernameHidden &&
                                        (() => {
                                            const label = !realm.loginWithEmailAllowed
                                                ? "username"
                                                : realm.registrationEmailAsUsername
                                                ? "email"
                                                : "usernameOrEmail";

                                            const autoCompleteHelper: "email" | "username" = 
                                                label === "email" ? "email" : "username";

                                            return (
                                                <div style={{ marginBottom: "16px" }}>
                                                    <label
                                                        htmlFor="username"
                                                        style={{ 
                                                            color: "#fff",
                                                            display: "block",
                                                            marginBottom: "8px",
                                                            fontWeight: "500",
                                                            fontSize: "16px"
                                                        }}
                                                    >
                                                        {msg(label)}
                                                    </label>
                                                    <input
                                                        tabIndex={1}
                                                        id="username"
                                                        className={classes?.kcInputClass}
                                                        name="username"
                                                        defaultValue={login?.username ?? ""}
                                                        type="text"
                                                        autoFocus={true}
                                                        autoComplete={autoCompleteHelper}
                                                        style={{ 
                                                            background: "rgba(255, 255, 255, 0.07)",
                                                            border: "1px solid rgba(255, 255, 255, 0.2)",
                                                            padding: "12px 15px",
                                                            borderRadius: "6px",
                                                            color: "#fff",
                                                            fontWeight: "400",
                                                            width: "100%",
                                                            boxSizing: "border-box",
                                                            height: "48px",
                                                            fontSize: "16px",
                                                            transition: "border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out"
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })()}
                                    
                                    <div style={{ marginBottom: "16px" }}>
                                        <label
                                            htmlFor="password"
                                            style={{ 
                                                color: "#fff",
                                                display: "block",
                                                marginBottom: "8px",
                                                fontWeight: "500",
                                                fontSize: "16px"
                                            }}
                                        >
                                            {msg("password")}
                                        </label>
                                        <div style={{ 
                                            position: "relative",
                                            display: "flex",
                                            alignItems: "center"
                                        }}>
                                            <input
                                                tabIndex={2}
                                                id="password"
                                                className={classes?.kcInputClass}
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                autoComplete="current-password"
                                                style={{ 
                                                    background: "rgba(255, 255, 255, 0.07)",
                                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                                    padding: "12px 15px",
                                                    borderRadius: "6px",
                                                    color: "#fff",
                                                    fontWeight: "400",
                                                    width: "100%",
                                                    boxSizing: "border-box",
                                                    height: "48px",
                                                    fontSize: "16px",
                                                    transition: "border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out"
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={togglePasswordVisibility}
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                                style={{
                                                    position: "absolute",
                                                    right: "10px",
                                                    background: "transparent",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    color: "rgba(255, 255, 255, 0.7)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    width: "40px",
                                                    height: "40px",
                                                    padding: 0,
                                                    borderRadius: "50%",
                                                    transition: "all 0.2s ease",
                                                    outline: "none"
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.color = "#fff";
                                                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                                                    e.currentTarget.style.background = "transparent";
                                                }}
                                            >
                                                {/* Eye icon - changes based on password visibility */}
                                                {showPassword ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                                                        <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                                        <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                                                        <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd" />
                                                        <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div
                                        style={{ 
                                            display: "flex", 
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: "16px"
                                        }}
                                    >
                                        <div>
                                            {realm.rememberMe && !usernameHidden && (
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px"
                                                }}>
                                                    <input
                                                        tabIndex={3}
                                                        id="rememberMe"
                                                        name="rememberMe"
                                                        type="checkbox"
                                                        style={{
                                                            width: "16px",
                                                            height: "16px",
                                                            accentColor: "#4a90e2"
                                                        }}
                                                        {...(login?.rememberMe
                                                            ? {
                                                                  checked: true,
                                                              }
                                                            : {})}
                                                    />
                                                    <label
                                                        htmlFor="rememberMe"
                                                        style={{ 
                                                            color: "#fff",
                                                            fontWeight: "400",
                                                            fontSize: "14px"
                                                        }}
                                                    >
                                                        {msg("rememberMe")}
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            {realm.resetPasswordAllowed && (
                                                <a
                                                    tabIndex={5}
                                                    href={url.loginResetCredentialsUrl}
                                                    style={{ 
                                                        color: "#63b3ed",
                                                        textDecoration: "none",
                                                        fontWeight: "500",
                                                        fontSize: "14px"
                                                    }}
                                                >
                                                    {msg("doForgotPassword")}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div id="kc-form-buttons" className={classes?.kcFormGroupClass}>
                                        <input
                                            type="hidden"
                                            id="id-hidden-input"
                                            name="credentialId"
                                            {...(auth?.selectedCredential !== undefined
                                                ? {
                                                      value: auth.selectedCredential,
                                                  }
                                                : {})}
                                        />
                                        <button
                                            tabIndex={4}
                                            className={classes?.kcButtonClass}
                                            name="login"
                                            id="kc-login"
                                            type="submit"
                                            disabled={isLoginButtonDisabled}
                                            style={{ 
                                                background: "linear-gradient(135deg, #4a90e2, #2563eb)",
                                                border: "none",
                                                padding: "14px 20px",
                                                borderRadius: "6px",
                                                color: "#fff",
                                                fontWeight: "600",
                                                cursor: "pointer",
                                                width: "100%",
                                                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                                                fontSize: "16px",
                                                height: "48px",
                                                transition: "transform 0.2s ease, background 0.2s ease"
                                            }}
                                        >
                                            {msgStr("doLogIn")}
                                        </button>
                                    </div>
                                    
                                    {/* Horizontal divider */}
                                    {socialProviders.length > 0 && (
                                        <div style={{
                                            height: "1px",
                                            background: "rgba(255, 255, 255, 0.1)",
                                            width: "100%",
                                            margin: "8px 0"
                                        }}></div>
                                    )}
                                </div>
                            </div>
                        </form>
                    )}
                </div>
                
                {realm.password && socialProviders.length > 0 && (
                    <div
                        id="kc-social-providers"
                        className={classes?.kcFormSocialAccountSectionClass}
                        style={{ 
                            background: "rgba(255, 255, 255, 0.05)", 
                            backdropFilter: "blur(16px)",
                            padding: "24px",
                            borderRadius: "12px",
                            marginTop: "20px",
                            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2), 0 0 1px rgba(255, 255, 255, 0.1)",
                            width: "100%",
                            maxWidth: "30rem",
                            boxSizing: "border-box",
                            border: "1px solid rgba(255, 255, 255, 0.1)"
                        }}
                    >
                        <h4 style={{ 
                            color: "#fff", 
                            textAlign: "center",
                            marginTop: 0,
                            marginBottom: "16px",
                            fontSize: "16px",
                            fontWeight: "500"
                        }}>
                            {msg("identity-provider-login-label")}
                        </h4>
                        
                        <ul
                            id="kc-social-providers-list"
                            className={classes?.kcFormSocialAccountListClass}
                            style={{ 
                                padding: 0,
                                margin: 0,
                                listStyle: "none",
                                display: "flex",
                                flexDirection: "column",
                                gap: "10px"
                            }}
                        >
                            {socialProviders.map(p => (
                                <li
                                    key={p.providerId}
                                    className={classes?.kcFormSocialAccountLinkClass}
                                    style={{ marginBottom: "8px" }}
                                >
                                    <a
                                        href={p.loginUrl}
                                        id={`zocial-${p.alias}`}
                                        className={`${classes?.kcFormSocialAccountListButtonClass} ${classes?.kcFormSocialAccountListButtonClass}-${p.providerId}`}
                                        style={{ 
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "100%",
                                            padding: "12px 16px",
                                            borderRadius: "6px",
                                            background: "rgba(255, 255, 255, 0.1)",
                                            color: "#fff",
                                            textDecoration: "none",
                                            fontWeight: "500",
                                            border: "1px solid rgba(255, 255, 255, 0.2)",
                                            transition: "background 0.2s ease"
                                        }}
                                    >
                                        <span>{p.displayName}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </Template>
    );
}