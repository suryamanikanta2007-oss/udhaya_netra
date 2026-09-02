using System;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using Microsoft.Win32;

namespace UdhayaNetram
{
    public class MainForm : Form
    {
        private WebBrowser webBrowser;
        private ToolStrip toolStrip;
        private ToolStripButton btnBack;
        private ToolStripButton btnForward;
        private ToolStripButton btnRefresh;
        private ToolStripButton btnHome;
        private ToolStripButton btnEpaper;
        private ToolStripButton btnPrint;
        private ToolStripLabel lblTitle;
        private ToolStripButton btnFullscreen;

        private const string AppUrl = "https://suryamanikanta2007-oss.github.io/udhaya_netra/";

        [STAThread]
        public static void Main()
        {
            // Configure modern browser engine emulation for modern HTML5/CSS/JS & Telugu rendering
            SetBrowserEmulation();

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }

        private static void SetBrowserEmulation()
        {
            try
            {
                string appName = Path.GetFileName(Application.ExecutablePath);
                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Internet Explorer\Main\FeatureControl\FEATURE_BROWSER_EMULATION"))
                {
                    if (key != null)
                    {
                        key.SetValue(appName, 11001, RegistryValueKind.DWord);
                    }
                }
            }
            catch { }
        }

        public MainForm()
        {
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            this.Text = "ఉదయ నేత్రం (Udhaya Netram) - Daily Telugu E-Paper & News Portal";
            this.Width = 1300;
            this.Height = 850;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.WindowState = FormWindowState.Normal;
            this.BackColor = Color.FromArgb(155, 0, 0); // Primary Maroon

            // Generate Icon
            try
            {
                Bitmap bmp = new Bitmap(32, 32);
                using (Graphics g = Graphics.FromImage(bmp))
                {
                    g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
                    g.FillEllipse(new SolidBrush(Color.FromArgb(155, 0, 0)), 0, 0, 31, 31);
                    g.FillEllipse(Brushes.White, 4, 10, 23, 12);
                    g.FillEllipse(new SolidBrush(Color.FromArgb(245, 158, 11)), 11, 11, 10, 10);
                }
                this.Icon = Icon.FromHandle(bmp.GetHicon());
            }
            catch { }

            // Navigation Toolbar
            toolStrip = new ToolStrip();
            toolStrip.GripStyle = ToolStripGripStyle.Hidden;
            toolStrip.BackColor = Color.FromArgb(11, 17, 32); // Dark Navy Topbar
            toolStrip.ForeColor = Color.White;
            toolStrip.Padding = new Padding(8, 4, 8, 4);
            toolStrip.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);

            // Title Label in Toolbar
            lblTitle = new ToolStripLabel("📰 ఉదయ నేత్రం (UDHAYA NETRAM)");
            lblTitle.ForeColor = Color.FromArgb(245, 158, 11); // Amber Gold
            lblTitle.Font = new Font("Noto Sans Telugu", 10.5f, FontStyle.Bold);

            // Navigation Buttons
            btnHome = new ToolStripButton(" 🏠 Home ");
            btnHome.ForeColor = Color.White;
            btnHome.Click += (s, e) => webBrowser.Navigate(AppUrl);

            btnBack = new ToolStripButton(" ◀ Back ");
            btnBack.ForeColor = Color.White;
            btnBack.Click += (s, e) => { if (webBrowser.CanGoBack) webBrowser.GoBack(); };

            btnForward = new ToolStripButton(" Forward ▶ ");
            btnForward.ForeColor = Color.White;
            btnForward.Click += (s, e) => { if (webBrowser.CanGoForward) webBrowser.GoForward(); };

            btnRefresh = new ToolStripButton(" 🔄 Refresh ");
            btnRefresh.ForeColor = Color.White;
            btnRefresh.Click += (s, e) => webBrowser.Refresh();

            btnEpaper = new ToolStripButton(" 📥 Daily E-Paper ");
            btnEpaper.ForeColor = Color.FromArgb(254, 243, 199);
            btnEpaper.BackColor = Color.FromArgb(155, 0, 0);
            btnEpaper.Click += (s, e) => webBrowser.Navigate(AppUrl + "#epaper");

            btnPrint = new ToolStripButton(" 🖨️ Print ");
            btnPrint.ForeColor = Color.White;
            btnPrint.Click += (s, e) => webBrowser.ShowPrintDialog();

            btnFullscreen = new ToolStripButton(" ⛶ Fullscreen ");
            btnFullscreen.ForeColor = Color.White;
            btnFullscreen.Click += (s, e) => ToggleFullscreen();

            toolStrip.Items.Add(lblTitle);
            toolStrip.Items.Add(new ToolStripSeparator());
            toolStrip.Items.Add(btnHome);
            toolStrip.Items.Add(btnBack);
            toolStrip.Items.Add(btnForward);
            toolStrip.Items.Add(btnRefresh);
            toolStrip.Items.Add(new ToolStripSeparator());
            toolStrip.Items.Add(btnEpaper);
            toolStrip.Items.Add(btnPrint);
            toolStrip.Items.Add(btnFullscreen);

            // WebBrowser Component
            webBrowser = new WebBrowser();
            webBrowser.Dock = DockStyle.Fill;
            webBrowser.ScriptErrorsSuppressed = true;
            webBrowser.IsWebBrowserContextMenuEnabled = true;

            webBrowser.Navigating += (s, e) =>
            {
                this.Text = "ఉదయ నేత్రం - లోడ్ అవుతోంది... (Loading...)";
            };

            webBrowser.DocumentCompleted += (s, e) =>
            {
                this.Text = "ఉదయ నేత్రం (Udhaya Netram) - Daily Telugu E-Paper & News";
            };

            this.Controls.Add(webBrowser);
            this.Controls.Add(toolStrip);

            // Initial Navigation
            webBrowser.Navigate(AppUrl);
        }

        private bool isFullscreen = false;
        private FormWindowState prevWindowState;
        private FormBorderStyle prevBorderStyle;

        private void ToggleFullscreen()
        {
            if (!isFullscreen)
            {
                prevWindowState = this.WindowState;
                prevBorderStyle = this.FormBorderStyle;
                this.FormBorderStyle = FormBorderStyle.None;
                this.WindowState = FormWindowState.Maximized;
                isFullscreen = true;
                btnFullscreen.Text = " 🗗 Exit Fullscreen ";
            }
            else
            {
                this.FormBorderStyle = prevBorderStyle;
                this.WindowState = prevWindowState;
                isFullscreen = false;
                btnFullscreen.Text = " ⛶ Fullscreen ";
            }
        }
    }
}
