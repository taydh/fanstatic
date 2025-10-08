<style>
    #docs pre {
        background-color: white;
        padding: .5rem;
        border: 1px solid var(--bs-border-color);
        border-radius: 0.25rem;
        -moz-tab-size: 2; /* Firefox 4+ */
        -o-tab-size: 2; /* Opera 11.5 & 12.1 only */
        tab-size: 2; /* Chrome 21+, Safari 6.1+, Opera 15+ */
    }

    #docs pre code {
		border-radius: 0.25rem;
        color: var(--bs-gray);
        font-family: 'Courier New', Courier, monospace;
        letter-spacing: -.25px;

    }
</style>
<section>
    <h1>STARTER GUIDE</h1>

    <p>This post will guide you to basic usage of the Fanstatic library, which is inserting, slash injecting, additional
        content from external file to existing HTML document.</p>
    <p>Let&rsquo;s start with a simple page that use only index.html where it will be showing different content
        depending on
        its querystring parameter as so: index.html?p=about, index.html?p=contact, etc.</p>

	<h2>Part I</h2>
	<p>
		Since external template files are loaded by javascript, you need to setup a minimal web server for this example to work.
		Make sure you can access html file using http:// or https:// protocol in your browser, not file:///.
	</p>
	<p>
		There are many examples to set up a web server, so it is beyond this documentation for now.
	</p>

	<h2>Part II</h2>
    <ol>
        <li>
            <p>Prepare the file structure for this example as so. You can later have your files structured however you like as long as you can point to the correct path.</p>
            <ul>
                <li>index.html</li>
                <li>templates/
                    <ul>
                        <li>home.html</li>
                        <li>about.html</li>
                        <li>contact.html</li>
                    </ul>
                </li>
            </ul>
        </li>
        <li>
            <p>Let&rsquo;s make the index.html as simple as possible.</p>
            <p>The page contains navigation links, container for main content, footer that will be the same in every
                page, and a
                script element adding the fanstatic library to the document.</p>
            <p>Inside the head tag, we need to have the base tag set followed by equivalent entry in our settings 
              when the website is under a subfolder other than the domain root.</p>

            <pre><code class="language-html">&lt;!DOCTYPE html&gt;
&lt;html&gt;
  &lt;head&gt;
    &lt;title&gt;First Example&lt;/title&gt;
    &lt;base href="/" &gt;
    &lt;script src="https://fanstatic.annexdesk.com/engine/v1/core/fanstatic.js"&gt;&lt;/script&gt;;
  &lt;/head&gt;
  &lt;body&gt;
    &lt;nav&gt;
      &lt;ul&gt;
        &lt;li&gt;&lt;a href="index.html"&gt;Home&lt;/a&gt;&lt;/li&gt;
        &lt;li&gt;&lt;a href="index.html?p=about"&gt;About&lt;/a&gt;&lt;/li&gt;
        &lt;li&gt;&lt;a href="index.html?p=contact"&gt;Contact&lt;/a&gt;&lt;/li&gt;
      &lt;/ul&gt;
    &lt;/nav&gt;
    &lt;main&gt;&lt;/main&gt;
    &lt;footer&gt;
      &copy;2025 - fanstatic.annexdesk.com
    &lt;/footer&gt;
  &lt;/body&gt;
&lt;/html&gt;
</code></pre>

        </li>
        <li>
            <p>Let&rsquo;s also populate the template files with some content in html format.</p>
            <p>home.html</p>
            <pre><code class="language-html">&lt;h1&gt;Welcome Home&lt;/h1&gt;
&lt;p&gt;
This is the home content.
&lt;/p&gt;
</code></pre>
            <p>about.html</p>
            <pre><code class="language-html">&lt;h1&gt;About Us&lt;/h1&gt;
&lt;p&gt;
We are the web enthusiast!
&lt;/p&gt;
</code></pre>
            <p>contact.html</p>
            <pre><code class="language-html">&lt;h1&gt;Contact&lt;/h1&gt;
&lt;p&gt;
Drop me a message at &lt;a href="mailto:me@example.com"&gt;me@example.com&lt;/a&gt;.
&lt;/p&gt;
</code></pre>
        </li>
        <li>
            <p>After that, let&rsquo;s add a custom script in the &lt;head&gt; element to evaluate the querystring in
                the page
                url and load the external template file.</p>
            <pre><code class="language-html">(...)
&lt;script&gt;
// start from DOMContentLoaded event to make sure initial scripts has been loaded
window.addEventListener('DOMContentLoaded', async function() {
  // Assign or replace settings.
  // Let's set base_url and log_render for now

  fanstatic.assign({
    base_url: document.baseURI, // to resolve relative URL
    log_render: true, // to display behind the scene in browser console
  });

  // Determine what page we on and use switch case structure to pick the template file.
  // You are free to modify route handling to whatever you see fit.

  const usp = new URLSearchParams(window.location.search);
  const page = usp.has('p') ? usp.get('p') : 'home';
  const main = document.querySelector('main');
 
  switch (page) {
  case 'home':
    await fanstatic.insert(main, './templates/home.html');
    break;
  case 'about':
    await fanstatic.insert(main, './templates/about.html');
    break;
  case 'contact':
    await fanstatic.insert(main, './templates/contact.html');
    break;
  default:
    main.innerHTML = 'Invalid page!';
    break;
  }
});
&lt;/script&gt;
(...)
</code></pre>
        </li>
        <li>
            <p>And that should be it for the first part!</p>
            <p>Open index.html in the browser and navigate to the rest of the links. Also try it with an invalid url.
            </p>
            <p>Note: the &ldquo;await&rdquo; and &ldquo;async&rdquo; keywords are necessary only when you want the
                template
                loaded in a synchronize manner (code below it will not executed before content is fully added to
                document). Later
                you should find out and choose whether that would be the case for your requirement or not.</p>
        </li>
    </ol>

    <h2>Part II</h2>
    <p>Adding content from external file is pretty cool I think, and soon you will need to do follow up actions that
        much
        preferred to be included within the template itself. The library got you covered!</p>
    <p>In this example, we want to change the style from script and change document title from within the
        &ldquo;about&rdquo; template.</p>
    <ol>
        <li>
            <p>Edit about.html, add &lt;script&gt; element and make it returns a handler function.</p>
            <p>You will find more about this handler function in the documentation, but for now let&rsquo;s use the
                first
                argument: the &ldquo;roof&rdquo;. With current settings, the &ldquo;roof&rdquo; is element object of a
                shadow
                &lt;div&gt; where we can utilize to get further reference to the template elements.</p>
            <p>Note 1: With current settings (no additional options), the content elements are loaded into a shadow
                &lt;div&gt;,
                so the script is executed BEFORE the content added into the document.</p>
            <p>Note 2: The library will only look for one first level &lt;script&gt; element to be evaluated.</p>
            <pre><code>&lt;h1&gt;About Us&lt;/h1&gt;
&lt;p&gt;
We are the web entusiast!
&lt;/p&gt;
&lt;script&gt;
  return function(roof) {
    // change document title
    document.title = document.title + ' - About Us'
    
    // get the p element from roof
    const p = roof.querySelector('p')
    p.style.fontStyle = 'italic'
  }
&lt;/script&gt;
</code></pre>
        </li>
        <li>
            <p>And now you have static-dynamic templating capability!</p>
            <p>Repen the &ldquo;about&rdquo; page and see the change. You can repeat it to the other template files.
                Keep
                following since there are more to it to help you build a &ldquo;fanstatic&rdquo; frontend!</p>
        </li>
    </ol>

    <h2>Summary</h2>
    <p>We instroduced to the basic feature offered by the Fanstatic library. More tools available within the library
        are
        the build up from this foundation. As introduced above, we just need simple reference and vanilla JS to achieve
        this
        point and I hope you can see how it will scale.</p>
    <p>However, client side processing in web browser has limit for its own good. In no time, you will find limitations,
        especially when building multipages website and SEO, such as the need for server side setup to have proper 404
        response status. We are embracing the limitations and it will be covered in different post.</p>
</section>

<script>
    return {
        onrender: async function() {
            hljs.highlightAll();
        }
    }
</script>