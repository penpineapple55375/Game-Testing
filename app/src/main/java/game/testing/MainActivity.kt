package game.testing

import android.annotation.SuppressLint
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    //val webURL = "file:///android_asset/HigherLowerQuest/dist/index.html"
    //val webURL = "https://play.famobi.com/knife-rain"
    private val embededGame = ""
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        ///web view tester
        webView = findViewById(R.id.webView)

        /*webView.webViewClient = WebViewClient()
        webView.loadUrl(webURL)
        webView.settings.javaScriptEnabled = true
        webView.settings.setSupportZoom(true)*/

        webView.loadData(embededGame, "text/html", "utf-8")
        webView.settings.javaScriptEnabled = true
        webView.settings.setSupportZoom(true)
        webView.webChromeClient = WebChromeClient()

    }
    /*@Suppress("DEPRECATION")
    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack()
        else super.onBackPressed()
    }*/
}