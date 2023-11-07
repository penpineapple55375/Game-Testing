package game.testing

import android.annotation.SuppressLint
import android.net.ConnectivityManager
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import java.io.BufferedReader
import java.io.ByteArrayInputStream
import java.io.IOException
import java.io.InputStream
import java.io.InputStreamReader

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    //val webURL = "file:///android_asset/RunAndJump/dist/index.html"
    val webURL = "https://play.famobi.com/color-tunnel"
    //private val embededGame = ""
    @Suppress("DEPRECATION")
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        ///web view tester
        ////////////////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////////////////
        webView = findViewById(R.id.webView)

        webView.webViewClient = WebViewClient()
        webView.loadUrl(webURL)
        webView.settings.javaScriptEnabled = true
        webView.settings.setSupportZoom(true)

        // knockout the ads
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, url: String): WebResourceResponse? {
                if (url.contains("google") || url.contains("facebook")) {
                    val textStream = ByteArrayInputStream("".toByteArray())
                    return getTextWebResource(textStream)
                }
                return super.shouldInterceptRequest(view, url)
            }
        }
        ////////////////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////////////////

        /*webView.loadData(embededGame, "text/html", "utf-8")
        webView.settings.javaScriptEnabled = true
        webView.settings.setSupportZoom(true)
        webView.webChromeClient = WebChromeClient()*/

    }
    private fun getTextWebResource(data: InputStream): WebResourceResponse {
        return WebResourceResponse("text/plain", "UTF-8", data)
    }
    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack()
        else super.onBackPressed()
    }
}