using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace NetworkEditor.Web.Controllers
{
    public class HomeController : Controller
    {
        //
        // GET: /Home/

        public ActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public ActionResult UploadSites()
        {
            return GetStringFromRequestFile();
        }
        [HttpPost]
        public ActionResult UploadAType()
        {
            return GetStringFromRequestFile();
        }

        [HttpPost]
        public ActionResult UploadBTypes()
        {
            return GetStringFromRequestFile();
        }

        private JsonResult GetStringFromRequestFile()
        {
            if (Request.Files.Count == 0)
                return Json(null);

            JsonResult result;

            string text = string.Empty;
            using (var streamReader = new StreamReader(Request.Files[0].InputStream))
            {
                text = streamReader.ReadToEnd();
            }

            result = Json(new { Data = text, success = true });
            result.ContentType = "text/plain";


            return result;
        }
    }
}
