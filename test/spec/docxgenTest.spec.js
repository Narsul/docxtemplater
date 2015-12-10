(function () {
    var DocUtils, DocXTemplater, DocxGen, Errors, PptxGen, SubContent, XmlMatcher, allStarted, angularParser, countFiles, data, docX, endLoadFile, expect, expectToThrow, expressions, file, fileNames, fs, getLength, j, k, len, len1, loadDocx, loadFile, loadImage, loadPptx, name, pngFiles, pptX, shouldBeSame, startTest, xmlUtil;

    docX = {};

    expressions = require('angular-expressions');

    angularParser = function (tag) {
        var expr;
        expr = expressions.compile(tag);
        return {
            get: function (scope) {
                return expr(scope);
            }
        };
    };

    shouldBeSame = function (zip1, zip2) {
        var i, results;
        if (typeof zip1 === "string") {
            zip1 = docX[zip1].getZip();
        }
        if (typeof zip2 === "string") {
            zip2 = docX[zip2].getZip();
        }
        results = [];
        for (i in zip1.files) {
            expect(zip1.files[i].options.date).not.to.be.equal(zip2.files[i].options.date, "Date differs");
            expect(zip1.files[i].name).to.be.equal(zip2.files[i].name, "Name differs");
            expect(zip1.files[i].options.dir).to.be.equal(zip2.files[i].options.dir, "IsDir differs");
            expect(zip1.files[i].asText().length).to.be.equal(zip2.files[i].asText().length, "Content differs");
            results.push(expect(zip1.files[i].asText()).to.be.equal(zip2.files[i].asText(), "Content differs"));
        }
        return results;
    };

    expect = require('chai').expect;

    expectToThrow = function (obj, method, type, expectedError) {
        var e, error, error1;
        e = null;
        try {
            obj[method]();
        } catch (error1) {
            error = error1;
            e = error;
        }
        expect(e).not.to.be.equal(null);
        expect(e).to.be.an('object');
        expect(e).to.be.instanceOf(Error);
        expect(e).to.be.instanceOf(type);
        expect(e).to.have.property('properties');
        expect(e.properties).to.be.a('object');
        expect(e.properties).to.have.property('explanation');
        expect(e.properties.explanation).to.be.a('string');
        expect(e.properties).to.have.property('id');
        expect(e.properties.id).to.be.a('string');
        delete e.properties.explanation;
        return expect(JSON.parse(JSON.stringify(e))).to.be.deep.equal(expectedError);
    };

    Errors = require('../../js/errors.js');

    XmlMatcher = require('../../js/xmlMatcher.js');

    DocxGen = require('../../js/index.js');

    PptxGen = DocxGen.PptxGen;

    DocUtils = require('../../js/docUtils.js');

    docX = {};

    pptX = {};

    data = {};

    SubContent = DocxGen.SubContent;

    DocXTemplater = DocxGen.DocXTemplater;

    xmlUtil = DocxGen.XmlUtil;

    fs = require('fs');

    fileNames = ["graph.docx", "imageExample.docx", "tagExample.docx", "tagExampleExpected.docx", "tagLoopExample.docx", "tagExampleExpected.docx", "tagLoopExampleImageExpected.docx", "tagProduitLoop.docx", "tagDashLoop.docx", "tagDashLoopList.docx", "tagDashLoopTable.docx", 'tagIntelligentLoopTableExpected.docx', 'cyrillic.docx', 'tableComplex2Example.docx', 'tableComplexExample.docx', "angularExample.docx", 'tagIntelligentLoopTable.docx'];

    getLength = function (d) {
        if (d.length != null) {
            return d.length;
        } else {
            return d.byteLength;
        }
    };

    startTest = function () {
        describe("DocxGenBasis", function () {
            it("should be defined", function () {
                return expect(DocxGen).not.to.be.equal(void 0);
            });
            return it("should construct", function () {
                var a;
                a = new DocxGen();
                return expect(a).not.to.be.equal(void 0);
            });
        });
        describe("XmlMatcher", function () {
            it('should work with simple tag', function () {
                var matcher, tag;
                tag = 'w:t';
                matcher = new XmlMatcher('<w:t>Text</w:t>');
                matcher.parse('w:t');
                expect(matcher.matches[0][0]).to.be.equal('<w:t>Text</w:t>');
                expect(matcher.matches[0][1]).to.be.equal('<w:t>');
                expect(matcher.matches[0][2]).to.be.equal('Text');
                return expect(matcher.matches[0].offset).to.be.equal(0);
            });
            it('should work with multiple tags', function () {
                var matcher, tag;
                tag = 'w:t';
                matcher = new XmlMatcher('<w:t>Text</w:t> TAG <w:t>Text2</w:t>');
                matcher.parse('w:t');
                expect(matcher.matches[1][0]).to.be.equal('<w:t>Text2</w:t>');
                expect(matcher.matches[1][1]).to.be.equal('<w:t>');
                expect(matcher.matches[1][2]).to.be.equal('Text2');
                return expect(matcher.matches[1].offset).to.be.equal(20);
            });
            it('should work with no tag, with w:t', function () {
                var matcher, tag;
                tag = 'w:t';
                matcher = new XmlMatcher('Text1</w:t><w:t>Text2');
                matcher.parse('w:t');
                expect(matcher.matches[0][0]).to.be.equal('Text1');
                expect(matcher.matches[0][1]).to.be.equal('');
                expect(matcher.matches[0][2]).to.be.equal('Text1');
                expect(matcher.matches[0].offset).to.be.equal(0);
                expect(matcher.matches[1][0]).to.be.equal('<w:t>Text2');
                expect(matcher.matches[1][1]).to.be.equal('<w:t>');
                expect(matcher.matches[1][2]).to.be.equal('Text2');
                return expect(matcher.matches[1].offset).to.be.equal(11);
            });
            it('should work with no tag, no w:t', function () {
                var matcher, tag;
                tag = 'w:t';
                matcher = new XmlMatcher('Text1');
                matcher.parse('w:t');
                expect(matcher.matches[0][0]).to.be.equal('Text1');
                expect(matcher.matches[0][1]).to.be.equal('');
                expect(matcher.matches[0][2]).to.be.equal('Text1');
                return expect(matcher.matches[0].offset).to.be.equal(0);
            });
            it('should not match with no </w:t> starter', function () {
                var matcher, tag;
                tag = 'w:t';
                matcher = new XmlMatcher('TAG<w:t>Text1</w:t>');
                matcher.parse('w:t');
                expect(matcher.matches[0][0]).to.be.equal('<w:t>Text1</w:t>');
                expect(matcher.matches[0][1]).to.be.equal('<w:t>');
                expect(matcher.matches[0][2]).to.be.equal('Text1');
                return expect(matcher.matches[0].offset).to.be.equal(3);
            });
            return it('should not match with no <w:t> ender', function () {
                var matcher, tag;
                tag = 'w:t';
                matcher = new XmlMatcher('<w:t>Text1</w:t>TAG');
                matcher.parse('w:t');
                return expect(matcher.matches.length).to.be.equal(1);
            });
        });
        describe("DocxGenLoading", function () {
            describe("ajax done correctly", function () {
                it("doc and img Data should have the expected length", function () {
                    expect(getLength(docX['imageExample.docx'].loadedContent)).to.be.equal(729580);
                    return expect(getLength(data['image.png'])).to.be.equal(18062);
                });
                return it("should have the right number of files (the docx unzipped)", function () {
                    docX['imageExample.docx'] = new DocxGen(docX['imageExample.docx'].loadedContent);
                    return expect(DocUtils.sizeOfObject(docX['imageExample.docx'].zip.files)).to.be.equal(16);
                });
            });
            describe("basic loading", function () {
                return it("should load file imageExample.docx", function () {
                    return expect(typeof docX['imageExample.docx']).to.be.equal('object');
                });
            });
            describe("content_loading", function () {
                it("should load the right content for the footer", function () {
                    var fullText;
                    fullText = docX['imageExample.docx'].getFullText("word/footer1.xml");
                    expect(fullText.length).not.to.be.equal(0);
                    return expect(fullText).to.be.equal('{last_name}{first_name}{phone}');
                });
                return it("should load the right content for the document", function () {
                    var fullText;
                    fullText = docX['imageExample.docx'].getFullText();
                    return expect(fullText).to.be.equal("");
                });
            });
            return describe("output and input", function () {
                return it("should be the same", function () {
                    var doc, output;
                    doc = new DocxGen(docX['tagExample.docx'].loadedContent);
                    output = doc.getZip().generate({
                        type: "base64"
                    });
                    expect(output.length).to.be.equal(90732);
                    return expect(output.substr(0, 50)).to.be.equal('UEsDBAoAAAAAAAAAIQAMTxYSlgcAAJYHAAATAAAAW0NvbnRlbn');
                });
            });
        });
        describe("DocxGenTemplating", function () {
            return describe("text templating", function () {
                it("should change values with template vars", function (done) {
                    var tags;
                    tags = {
                        "first_name": "Hipp",
                        "last_name": "Edgar",
                        "phone": "0652455478",
                        "description": "New Website"
                    };
                    docX['tagExample.docx'].setData(tags);
                    docX['tagExample.docx'].render().then(function(){
                        expect(docX['tagExample.docx'].getFullText()).to.be.equal('Edgar Hipp');
                        expect(docX['tagExample.docx'].getFullText("word/header1.xml")).to.be.equal('Edgar Hipp0652455478New Website');
                        expect(docX['tagExample.docx'].getFullText("word/footer1.xml")).to.be.equal('EdgarHipp0652455478');
                        done();
                    });
                });
                return it("should export the good file", function () {
                    return shouldBeSame('tagExample.docx', 'tagExampleExpected.docx');
                });
            });
        });
        describe("DocxGenTemplatingForLoop", function () {
            return describe("textLoop templating", function () {
                it("should replace all the tags", function (done) {
                    var tags;
                    tags = {
                        "nom": "Hipp",
                        "prenom": "Edgar",
                        "telephone": "0652455478",
                        "description": "New Website",
                        "offre": [
                            {
                                "titre": "titre1",
                                "prix": "1250"
                            }, {
                                "titre": "titre2",
                                "prix": "2000"
                            }, {
                                "titre": "titre3",
                                "prix": "1400",
                                "nom": "Offre"
                            }
                        ]
                    };
                    docX['tagLoopExample.docx'].setData(tags);
                    docX['tagLoopExample.docx'].render().then(function(){
                        expect(docX['tagLoopExample.docx'].getFullText()).to.be.equal('Votre proposition commercialeHippPrix: 1250Titre titre1HippPrix: 2000Titre titre2OffrePrix: 1400Titre titre3HippEdgar');
                        done();
                    });
                });
                it("should work with loops inside loops", function (done) {
                    var expectedText, tags, text;
                    tags = {
                        "products": [
                            {
                                "title": "Microsoft",
                                "name": "DOS",
                                "reference": "Win7",
                                "avantages": [
                                    {
                                        "title": "Everyone uses it",
                                        "proof": [
                                            {
                                                "reason": "it is quite cheap"
                                            }, {
                                                "reason": "it is quit simple"
                                            }, {
                                                "reason": "it works on a lot of different Hardware"
                                            }
                                        ]
                                    }
                                ]
                            }, {
                                "title": "Linux",
                                "name": "Ubuntu",
                                "reference": "Ubuntu10",
                                "avantages": [
                                    {
                                        "title": "It's very powerful",
                                        "proof": [
                                            {
                                                "reason": "the terminal is your friend"
                                            }, {
                                                "reason": "Hello world"
                                            }, {
                                                "reason": "it's free"
                                            }
                                        ]
                                    }
                                ]
                            }, {
                                "title": "Apple",
                                "name": "Mac",
                                "reference": "OSX",
                                "avantages": [
                                    {
                                        "title": "It's very easy",
                                        "proof": [
                                            {
                                                "reason": "you can do a lot just with the mouse"
                                            }, {
                                                "reason": "It's nicely designed"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    };
                    docX['tagProduitLoop.docx'].setData(tags);
                    docX['tagProduitLoop.docx'].render().then(function(){
                        text = docX['tagProduitLoop.docx'].getFullText();
                        expectedText = "MicrosoftProduct name : DOSProduct reference : Win7Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different HardwareLinuxProduct name : UbuntuProduct reference : Ubuntu10It's very powerfulProof that it works nicely : It works because the terminal is your friend It works because Hello world It works because it's freeAppleProduct name : MacProduct reference : OSXIt's very easyProof that it works nicely : It works because you can do a lot just with the mouse It works because It's nicely designed";
                        expect(text.length).to.be.equal(expectedText.length);
                        expect(text).to.be.equal(expectedText);
                        done();
                    })
                });
                it('should not have sideeffects with inverted with array length 3', function () {
                    var content, scope, xmlTemplater;
                    content = "<w:t>{^todos}No {/todos}Todos</w:t>\n<w:t>{#todos}{.}{/todos}</w:t>";
                    scope = {
                        "todos": ["A", "B", "C"]
                    };
                    xmlTemplater = new DocXTemplater(content, {
                        tags: scope
                    });
                    xmlTemplater.render();
                    return expect(xmlTemplater.content).to.be.deep.equal("<w:t>Todos</w:t>\n<w:t>ABC</w:t>");
                });
                it('should not have sideeffects with inverted with empty array', function () {
                    var content, scope, xmlTemplater;
                    content = "<w:t>{^todos}No {/todos}Todos</w:t>\n<w:t>{#todos}{.}{/todos}</w:t>";
                    scope = {
                        "todos": []
                    };
                    xmlTemplater = new DocXTemplater(content, {
                        tags: scope
                    });
                    xmlTemplater.render();
                    return expect(xmlTemplater.content).to.be.deep.equal("<w:t>No Todos</w:t>\n<w:t></w:t>");
                });
                return it("should provide inverted loops", function () {
                    var content;
                    content = "<w:t>{^products}No products found{/products}</w:t>";
                    [
                        {
                            products: []
                        }, {
                        products: false
                    }, {}
                    ].forEach(function (tags) {
                        var doc;
                        doc = new DocXTemplater(content, {
                            tags: tags
                        });
                        doc.render();
                        return expect(doc.getFullText()).to.be.equal('No products found');
                    });
                    return [
                        {
                            products: [
                                {
                                    name: "Bread"
                                }
                            ]
                        }, {
                            products: true
                        }, {
                            products: "Bread"
                        }, {
                            products: {
                                name: "Bread"
                            }
                        }
                    ].forEach(function (tags) {
                        var doc;
                        doc = new DocXTemplater(content, {
                            tags: tags
                        });
                        doc.render();
                        return expect(doc.getFullText()).to.be.equal('');
                    });
                });
            });
        });
        describe("Xml Util", function () {
            it("should compute the scope between 2 <w:t>", function () {
                var scope;
                scope = xmlUtil.getListXmlElements("undefined</w:t></w:r></w:p><w:p w:rsidP=\"008A4B3C\" w:rsidR=\"007929C1\" w:rsidRDefault=\"007929C1\" w:rsidRPr=\"008A4B3C\"><w:pPr><w:pStyle w:val=\"Sous-titre\"/></w:pPr><w:r w:rsidRPr=\"008A4B3C\"><w:t xml:space=\"preserve\">Audit réalisé le ");
                return expect(scope).to.be.eql([
                    {
                        tag: '</w:t>',
                        offset: 9
                    }, {
                        tag: '</w:r>',
                        offset: 15
                    }, {
                        tag: '</w:p>',
                        offset: 21
                    }, {
                        tag: '<w:p>',
                        offset: 27
                    }, {
                        tag: '<w:r>',
                        offset: 162
                    }, {
                        tag: '<w:t>',
                        offset: 188
                    }
                ]);
            });
            it("should compute the scope between 2 <w:t> in an Array", function () {
                var scope;
                scope = xmlUtil.getListXmlElements("urs</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:type=\"dxa\" w:w=\"4140\"/></w:tcPr><w:p w:rsidP=\"00CE524B\" w:rsidR=\"00CE524B\" w:rsidRDefault=\"00CE524B\"><w:pPr><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\"/><w:color w:val=\"auto\"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\"/><w:color w:val=\"auto\"/></w:rPr><w:t>Sur exté");
                return expect(scope).to.be.eql([
                    {
                        tag: '</w:t>',
                        offset: 3
                    }, {
                        tag: '</w:r>',
                        offset: 9
                    }, {
                        tag: '</w:p>',
                        offset: 15
                    }, {
                        tag: '</w:tc>',
                        offset: 21
                    }, {
                        tag: '<w:tc>',
                        offset: 28
                    }, {
                        tag: '<w:p>',
                        offset: 83
                    }, {
                        tag: '<w:r>',
                        offset: 268
                    }, {
                        tag: '<w:t>',
                        offset: 374
                    }
                ]);
            });
            return it('should compute the scope between a w:t in an array and the other outside', function () {
                var scope;
                scope = xmlUtil.getListXmlElements("defined </w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p w:rsidP=\"00CA7135\" w:rsidR=\"00BE3585\" w:rsidRDefault=\"00BE3585\"/><w:p w:rsidP=\"00CA7135\" w:rsidR=\"00BE3585\" w:rsidRDefault=\"00BE3585\"/><w:p w:rsidP=\"00CA7135\" w:rsidR=\"00137C91\" w:rsidRDefault=\"00137C91\"><w:r w:rsidRPr=\"00B12C70\"><w:rPr><w:bCs/></w:rPr><w:t>Coût ressources ");
                return expect(scope).to.be.eql([
                    {
                        tag: '</w:t>',
                        offset: 8
                    }, {
                        tag: '</w:r>',
                        offset: 14
                    }, {
                        tag: '</w:p>',
                        offset: 20
                    }, {
                        tag: '</w:tc>',
                        offset: 26
                    }, {
                        tag: '</w:tr>',
                        offset: 33
                    }, {
                        tag: '</w:tbl>',
                        offset: 40
                    }, {
                        tag: '<w:p>',
                        offset: 188
                    }, {
                        tag: '<w:r>',
                        offset: 257
                    }, {
                        tag: '<w:t>',
                        offset: 306
                    }
                ]);
            });
        });
        describe("Dash Loop Testing", function () {
            it("dash loop ok on simple table -> w:tr", function (done) {
                var expectedText, tags, text;
                tags = {
                    "os": [
                        {
                            "type": "linux",
                            "price": "0",
                            "reference": "Ubuntu10"
                        }, {
                            "type": "DOS",
                            "price": "500",
                            "reference": "Win7"
                        }, {
                            "type": "apple",
                            "price": "1200",
                            "reference": "MACOSX"
                        }
                    ]
                };
                docX['tagDashLoop.docx'].setData(tags);
                docX['tagDashLoop.docx'].render().then(function(){
                    expectedText = "linux0Ubuntu10DOS500Win7apple1200MACOSX";
                    text = docX['tagDashLoop.docx'].getFullText();
                    expect(text).to.be.equal(expectedText);
                    done();
                });
            });
            it("dash loop ok on simple table -> w:table", function (done) {
                var expectedText, tags, text;
                tags = {
                    "os": [
                        {
                            "type": "linux",
                            "price": "0",
                            "reference": "Ubuntu10"
                        }, {
                            "type": "DOS",
                            "price": "500",
                            "reference": "Win7"
                        }, {
                            "type": "apple",
                            "price": "1200",
                            "reference": "MACOSX"
                        }
                    ]
                };
                docX['tagDashLoopTable.docx'].setData(tags);
                docX['tagDashLoopTable.docx'].render().then(function(){
                    expectedText = "linux0Ubuntu10DOS500Win7apple1200MACOSX";
                    text = docX['tagDashLoopTable.docx'].getFullText();
                    expect(text).to.be.equal(expectedText);
                    done();
                })
            });
            return it("dash loop ok on simple list -> w:p", function (done) {
                var expectedText, tags, text;
                tags = {
                    "os": [
                        {
                            "type": "linux",
                            "price": "0",
                            "reference": "Ubuntu10"
                        }, {
                            "type": "DOS",
                            "price": "500",
                            "reference": "Win7"
                        }, {
                            "type": "apple",
                            "price": "1200",
                            "reference": "MACOSX"
                        }
                    ]
                };
                docX['tagDashLoopList.docx'].setData(tags);
                docX['tagDashLoopList.docx'].render().then(function(){
                    expectedText = 'linux 0 Ubuntu10 DOS 500 Win7 apple 1200 MACOSX ';
                    text = docX['tagDashLoopList.docx'].getFullText();
                    expect(text).to.be.equal(expectedText);
                    done();
                });
            });
        });
        describe("Intelligent Loop Tagging", function () {
            return it("should work with tables", function (done) {
                var expectedText, tags, text;
                tags = {
                    clients: [
                        {
                            first_name: "John",
                            last_name: "Doe",
                            phone: "+33647874513"
                        }, {
                            first_name: "Jane",
                            last_name: "Doe",
                            phone: "+33454540124"
                        }, {
                            first_name: "Phil",
                            last_name: "Kiel",
                            phone: "+44578451245"
                        }, {
                            first_name: "Dave",
                            last_name: "Sto",
                            phone: "+44548787984"
                        }
                    ]
                };
                docX['tagIntelligentLoopTable.docx'].setData(tags);
                docX['tagIntelligentLoopTable.docx'].render().then(function(){
                    expectedText = 'JohnDoe+33647874513JaneDoe+33454540124PhilKiel+44578451245DaveSto+44548787984';
                    text = docX['tagIntelligentLoopTableExpected.docx'].getFullText();
                    expect(text).to.be.equal(expectedText);
                    shouldBeSame('tagIntelligentLoopTable.docx', 'tagIntelligentLoopTableExpected.docx');
                    done();
                });
            });
        });
        describe('intelligent tagging multiple tables', function () {
            return it('should work with multiple rows', function () {
                var content, doc, scope;
                content = "<w:tbl>\n	<w:tr>\n		<w:tc>\n			<w:p>\n				<w:r>\n					<w:t>{#clauses} Clause</w:t>\n				</w:r>\n			</w:p>\n		</w:tc>\n	</w:tr>\n	<w:tr>\n		<w:tc>\n			<w:p>\n				<w:r>\n					<w:t>{/clauses}</w:t>\n				</w:r>\n			</w:p>\n		</w:tc>\n	</w:tr>\n</w:tbl>";
                scope = {};
                doc = new DocXTemplater(content, {
                    tags: scope,
                    intelligentTagging: true
                });
                return doc.render();
            });
        });
        describe("getTags", function () {
            it("should work with simple document", function () {
                var d, tempVars;
                d = new DocxGen(docX['tagExample.docx'].loadedContent, {}, {
                    intelligentTagging: false
                });
                tempVars = d.getTags();
                return expect(tempVars).to.be.eql([
                    {
                        fileName: 'word/header1.xml',
                        vars: {
                            def: {},
                            undef: {
                                last_name: true,
                                first_name: true,
                                phone: true,
                                description: true
                            }
                        }
                    }, {
                        fileName: 'word/footer1.xml',
                        vars: {
                            def: {},
                            undef: {
                                last_name: true,
                                first_name: true,
                                phone: true
                            }
                        }
                    }, {
                        fileName: 'word/document.xml',
                        vars: {
                            def: {},
                            undef: {
                                last_name: true,
                                first_name: true
                            }
                        }
                    }
                ]);
            });
            return it("should work with loop document", function () {
                var tempVars;
                docX['tagLoopExample.docx'] = new DocxGen(docX['tagLoopExample.docx'].loadedContent, {}, {
                    intelligentTagging: false
                });
                tempVars = docX['tagLoopExample.docx'].getTags();
                return expect(tempVars).to.be.eql([
                    {
                        fileName: 'word/header1.xml',
                        vars: {
                            def: {},
                            undef: {
                                nom: true,
                                prenom: true
                            }
                        }
                    }, {
                        fileName: 'word/footer1.xml',
                        vars: {
                            def: {},
                            undef: {
                                nom: true,
                                prenom: true,
                                telephone: true
                            }
                        }
                    }, {
                        fileName: 'word/document.xml',
                        vars: {
                            def: {},
                            undef: {
                                offre: {
                                    nom: true,
                                    prix: true,
                                    titre: true
                                },
                                nom: true,
                                prenom: true
                            }
                        }
                    }
                ]);
            });
        });
        describe("compilation", function () {
            it("should work with dot", function () {
                var content, scope, xmlTemplater;
                content = "<w:t>Hello {.}</w:t>";
                scope = "Edgar";
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.compiled.compiled).to.be.deep.equal([
                    '<w:t xml:space="preserve">', 'Hello ', {
                        type: 'tag',
                        tag: '.'
                    }, '</w:t>'
                ]);
            });
            it("should work with text with special characters", function () {
                var content, scope, xmlTemplater;
                content = "<w:t>Hello {&gt;name}</w:t>";
                scope = {
                    ">name": "Edgar"
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.compiled.compiled).to.be.deep.equal([
                    '<w:t xml:space="preserve">', 'Hello ', {
                        type: 'tag',
                        tag: '>name'
                    }, '</w:t>'
                ]);
            });
            it("should work with simple text", function () {
                var content, scope, xmlTemplater;
                content = "<w:t>Hello {name}</w:t>";
                scope = {
                    "name": "Edgar"
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.compiled.compiled).to.be.deep.equal([
                    '<w:t xml:space="preserve">', 'Hello ', {
                        type: 'tag',
                        tag: 'name'
                    }, '</w:t>'
                ]);
            });
            it("should work with two tags", function () {
                var content, scope, xmlTemplater;
                content = "<w:t>Hello {name}</w:t>\n<w:t>Hello {name2}</w:t>";
                scope = {
                    "name": "Edgar",
                    "name2": "John"
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.compiled.compiled).to.be.deep.equal([
                    '<w:t xml:space="preserve">', 'Hello ', {
                        type: 'tag',
                        tag: 'name'
                    }, '</w:t>', '\n', '<w:t xml:space="preserve">', 'Hello ', {
                        type: 'tag',
                        tag: 'name2'
                    }, '</w:t>'
                ]);
            });
            it("should compile without start Tag", function () {
                var content, scope, xmlTemplater;
                content = "Hello </w:t>TAGS...TAGS<w:t> {name}";
                scope = {
                    "name": "Edgar"
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.compiled.compiled).to.be.deep.equal([
                    'Hello </w:t>TAGS...TAGS', '<w:t xml:space="preserve">', ' ', {
                        type: 'tag',
                        tag: 'name'
                    }
                ]);
            });
            it("should compile without end Tag and without start tag", function () {
                var content, scope, xmlTemplater;
                content = "Hello </w:t>TAGS...TAGS<w:t> {name} </w:t>TAGS2...TAGS2<w:t> {name} </w:t>TAGS3...TAGS3<w:t> Bye";
                scope = {
                    "name": "Edgar"
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.compiled.compiled).to.be.deep.equal([
                    'Hello </w:t>TAGS...TAGS', '<w:t xml:space="preserve">', ' ', {
                        type: 'tag',
                        tag: 'name'
                    }, ' ', '</w:t>', 'TAGS2...TAGS2', '<w:t xml:space="preserve">', ' ', {
                        type: 'tag',
                        tag: 'name'
                    }, ' ', '</w:t>', 'TAGS3...TAGS3<w:t> Bye'
                ]);
            });
            it("should with splitted tags", function () {
                var content, scope, xmlTemplater;
                content = "{</w:t>TAGS...TAGS<w:t>name</w:t>TAGS2...TAGS2<w:t>} {name} </w:t>TAGS3...TAGS3<w:t> Bye";
                scope = {};
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.compiled.compiled).to.be.deep.equal([
                    {
                        type: 'tag',
                        tag: 'name'
                    }, '</w:t>TAGS...TAGS', '<w:t>', '</w:t>', 'TAGS2...TAGS2', '<w:t xml:space="preserve">', ' ', {
                        type: 'tag',
                        tag: 'name'
                    }, ' ', '</w:t>', 'TAGS3...TAGS3<w:t> Bye'
                ]);
            });
            it("should work with loops", function () {
                var content, scope, xmlTemplater;
                content = "<w:t> {#users} {name} {/users}</w:t>";
                scope = {
                    users: [
                        {
                            name: "Edgar"
                        }
                    ]
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.compiled.compiled).to.be.deep.equal([
                    '<w:t> ', {
                        type: 'loop',
                        inverted: false,
                        tag: 'users',
                        template: [
                            ' ', {
                                type: 'tag',
                                tag: 'name'
                            }, ' '
                        ]
                    }, '</w:t>'
                ]);
            });
            it("should work with inverted loops", function () {
                var content, scope, xmlTemplater;
                content = "<w:t> {^users} {name} {/users}</w:t>";
                scope = {
                    users: [
                        {
                            name: "Edgar"
                        }
                    ]
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.compiled.compiled).to.be.deep.equal([
                    '<w:t> ', {
                        type: 'loop',
                        inverted: true,
                        tag: 'users',
                        template: [
                            ' ', {
                                type: 'tag',
                                tag: 'name'
                            }, ' '
                        ]
                    }, '</w:t>'
                ]);
            });
            it("should work with raw tag", function () {
                var content, scope, xmlTemplater;
                content = "<w:t>Hi Hi </w:t><w:p><w:t>{@raw}</w:t></w:p><w:t>Ho</w:t>";
                scope = {
                    raw: ""
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.compiled.compiled).to.be.deep.equal([
                    "<w:t>Hi Hi </w:t>", {
                        type: 'raw',
                        tag: 'raw'
                    }, "<w:t>Ho</w:t>"
                ]);
            });
            it("should not error with raw tag", function () {
                var content, scope, xmlTemplater;
                content = "<w:t>Hi Hi </w:t><w:p><w:t>{@raw}</w:t></w:p><w:t>Ho</w:t>";
                scope = {};
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                expect(xmlTemplater.compiled.compiled).to.be.deep.equal([
                    "<w:t>Hi Hi </w:t>", {
                        type: 'raw',
                        tag: 'raw'
                    }, "<w:t>Ho</w:t>"
                ]);
                return expect(xmlTemplater.content).to.be.deep.equal("<w:t>Hi Hi </w:t><w:t>Ho</w:t>");
            });
            it("should work with complicated loop", function () {
                var content, scope, xmlTemplater;
                content = "<w:t> {#users} {name} </w:t>TAG..TAG<w:t>{/users}</w:t>TAG2<w:t>{name}";
                scope = {
                    users: [
                        {
                            user: "Edgar"
                        }
                    ]
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.compiled.compiled).to.be.deep.equal([
                    '<w:t> ', {
                        type: 'loop',
                        inverted: false,
                        tag: 'users',
                        template: [
                            ' ', {
                                type: 'tag',
                                tag: 'name'
                            }, ' ', '</w:t>TAG..TAG<w:t>'
                        ]
                    }, '</w:t>TAG2', '<w:t xml:space="preserve">', {
                        type: 'tag',
                        tag: 'name'
                    }
                ]);
            });
            return it("should work with intelligent tagging", function () {
                var content, scope, xmlTemplater;
                content = "<w:t>Hello {name}</w:t>\nTAG\n<w:tr>\n<w:tc><w:t>{#table1}Hi</w:t></w:tc>\n<w:tc><w:t>{/table1}</w:t></w:tc>\n</w:tr>\nTAG2\n<w:tr>\n<w:tc><w:t>{#table2}Ho</w:t></w:tc>\n<w:tc><w:p><w:t>{/table2}</w:t></w:p>\n</w:tc>\n</w:tr>\n<w:t>{key}</w:t>".replace(/\n/g, "");
                scope = {
                    "table1": [1],
                    "key": "value"
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope,
                    intelligentTagging: true
                });
                xmlTemplater.render();
                return expect(xmlTemplater.compiled.compiled).to.be.deep.equal([
                    '<w:t xml:space="preserve">', 'Hello ', {
                        type: 'tag',
                        tag: 'name'
                    }, '</w:t>', 'TAG', {
                        type: 'loop',
                        inverted: false,
                        tag: "table1",
                        template: ["<w:tr><w:tc><w:t xml:space=\"preserve\">Hi</w:t></w:tc><w:tc><w:t xml:space=\"preserve\"></w:t></w:tc></w:tr>"]
                    }, 'TAG2', {
                        type: 'loop',
                        inverted: false,
                        tag: "table2",
                        template: ["<w:tr><w:tc><w:t xml:space=\"preserve\">Ho</w:t></w:tc><w:tc><w:p><w:t xml:space=\"preserve\"></w:t></w:p></w:tc></w:tr>"]
                    }, '<w:t xml:space="preserve">', {
                        type: 'tag',
                        tag: 'key'
                    }, '</w:t>'
                ]);
            });
        });
        describe("xmlTemplater", function () {
            it("should work with simpleContent", function () {
                var content, scope, xmlTemplater;
                content = "<w:t>Hello {name}</w:t>";
                scope = {
                    "name": "Edgar"
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.getFullText()).to.be.equal('Hello Edgar');
            });
            it("should work with {.} for this", function () {
                var content, scope, xmlTemplater;
                content = "<w:t>Hello {.}</w:t>";
                scope = 'Edgar';
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.getFullText()).to.be.equal('Hello Edgar');
            });
            it("should work with {.} for this inside loop", function () {
                var content, scope, xmlTemplater;
                content = "<w:t>Hello {#names}{.},{/names}</w:t>";
                scope = {
                    names: ['Edgar', 'John']
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.getFullText()).to.be.equal('Hello Edgar,John,');
            });
            it("should work with non w:t content", function () {
                var content, scope, xmlTemplater;
                content = "Hello {name}";
                scope = {
                    "name": "edgar"
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.content).to.be.equal('Hello edgar');
            });
            it("should work with tag in two elements", function () {
                var content, scope, xmlTemplater;
                content = "<w:t>Hello {</w:t><w:t>name}</w:t>";
                scope = {
                    "name": "Edgar"
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.getFullText()).to.be.equal('Hello Edgar');
            });
            it("should work with splitted tag in three elements", function () {
                var content, scope, xmlTemplater;
                content = "<w:t>Hello {</w:t><w:t>name</w:t><w:t>}</w:t>";
                scope = {
                    "name": "Edgar"
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.getFullText()).to.be.equal('Hello Edgar');
            });
            it("should work with simple loop with object value", function () {
                var content, scope, xmlTemplater;
                content = "<w:t>Hello {#person}{name}{/person}</w:t>";
                scope = {
                    "person": {
                        "name": "Edgar"
                    }
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.getFullText()).to.be.equal('Hello Edgar');
            });
            it("should work with simple Loop", function () {
                var content, scope, xmlTemplater;
                content = "<w:t>Hello {#names}{name},{/names}</w:t>";
                scope = {
                    "names": [
                        {
                            "name": "Edgar"
                        }, {
                            "name": "Mary"
                        }, {
                            "name": "John"
                        }
                    ]
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.getFullText()).to.be.equal('Hello Edgar,Mary,John,');
            });
            it("should work with simple Loop with boolean value", function () {
                var content, scope, xmlTemplater;
                content = "<w:t>Hello {#showName}{name},{/showName}</w:t>";
                scope = {
                    "showName": true,
                    "name": "Edgar"
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                expect(xmlTemplater.getFullText()).to.be.equal('Hello Edgar,');
                scope = {
                    "showName": false,
                    "name": "Edgar"
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.getFullText()).to.be.equal('Hello ');
            });
            it("should work with dash Loop", function () {
                var content, scope, xmlTemplater;
                content = "<w:p><w:t>Hello {-w:p names}{name},{/names}</w:t></w:p>";
                scope = {
                    "names": [
                        {
                            "name": "Edgar"
                        }, {
                            "name": "Mary"
                        }, {
                            "name": "John"
                        }
                    ]
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.getFullText()).to.be.equal('Hello Edgar,Hello Mary,Hello John,');
            });
            it("should work with loop and innerContent", function () {
                var content, scope, xmlTemplater;
                content = "</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:pPr><w:pStyle w:val=\"Titre1\"/></w:pPr><w:r><w:t>{title</w:t></w:r><w:r w:rsidR=\"00923B77\"><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRPr=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:r><w:t>Proof that it works nicely :</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00923B77\" w:rsidP=\"00923B77\"><w:pPr><w:numPr><w:ilvl w:val=\"0\"/><w:numId w:val=\"1\"/></w:numPr></w:pPr><w:r><w:t>{#pr</w:t></w:r><w:r w:rsidR=\"00713414\"><w:t>oof</w:t></w:r><w:r><w:t xml:space=\"preserve\">} </w:t></w:r><w:r w:rsidR=\"00713414\"><w:t>It works because</w:t></w:r><w:r><w:t xml:space=\"preserve\"> {</w:t></w:r><w:r w:rsidR=\"006F26AC\"><w:t>reason</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:pPr><w:numPr><w:ilvl w:val=\"0\"/><w:numId w:val=\"1\"/></w:numPr></w:pPr><w:r><w:t>{/proof</w:t></w:r><w:r w:rsidR=\"00923B77\"><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00FD04E9\" w:rsidRDefault=\"00923B77\"><w:r><w:t>";
                scope = {
                    "title": "Everyone uses it",
                    "proof": [
                        {
                            "reason": "it is quite cheap"
                        }, {
                            "reason": "it is quit simple"
                        }, {
                            "reason": "it works on a lot of different Hardware"
                        }
                    ]
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.getFullText()).to.be.equal('Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different Hardware');
            });
            it("should work with loop and innerContent (with last)", function () {
                var content, scope, xmlTemplater;
                content = "Start </w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:pPr><w:pStyle w:val=\"Titre1\"/></w:pPr><w:r><w:t>{title</w:t></w:r><w:r w:rsidR=\"00923B77\"><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRPr=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:r><w:t>Proof that it works nicely :</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00923B77\" w:rsidP=\"00923B77\"><w:pPr><w:numPr><w:ilvl w:val=\"0\"/><w:numId w:val=\"1\"/></w:numPr></w:pPr><w:r><w:t>{#pr</w:t></w:r><w:r w:rsidR=\"00713414\"><w:t>oof</w:t></w:r><w:r><w:t xml:space=\"preserve\">} </w:t></w:r><w:r w:rsidR=\"00713414\"><w:t>It works because</w:t></w:r><w:r><w:t xml:space=\"preserve\"> {</w:t></w:r><w:r w:rsidR=\"006F26AC\"><w:t>reason</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00923B77\" w:rsidRDefault=\"00713414\" w:rsidP=\"00923B77\"><w:pPr><w:numPr><w:ilvl w:val=\"0\"/><w:numId w:val=\"1\"/></w:numPr></w:pPr><w:r><w:t>{/proof</w:t></w:r><w:r w:rsidR=\"00923B77\"><w:t>}</w:t></w:r></w:p><w:p w:rsidR=\"00FD04E9\" w:rsidRDefault=\"00923B77\"><w:r><w:t> End";
                scope = {
                    "title": "Everyone uses it",
                    "proof": [
                        {
                            "reason": "it is quite cheap"
                        }, {
                            "reason": "it is quit simple"
                        }, {
                            "reason": "it works on a lot of different Hardware"
                        }
                    ]
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.getFullText()).to.be.equal('Start Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different Hardware End');
            });
            it('should work with not w:t tag (if the for loop is like {#forloop} text {/forloop}) ', function () {
                var content, scope, xmlTemplater;
                content = "Hello {#names}{name},{/names}";
                scope = {
                    "names": [
                        {
                            "name": "Edgar"
                        }, {
                            "name": "Mary"
                        }, {
                            "name": "John"
                        }
                    ]
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.content).to.be.equal('Hello Edgar,Mary,John,');
            });
            it("should work with delimiter in value", function () {
                var content, scope, xmlTemplater;
                content = "<w:t>Hello {name}</w:t>";
                scope = {
                    "name": "{edgar}"
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.getFullText()).to.be.equal('Hello {edgar}');
            });
            it('should work with delimiter in value )with loop)', function () {
                var content, scope, xmlTemplater;
                content = "Hello {#names}{name},{/names}";
                scope = {
                    "names": [
                        {
                            "name": "{John}"
                        }, {
                            "name": "M}}{ary"
                        }, {
                            "name": "Di{{{gory"
                        }
                    ]
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.getFullText()).to.be.equal('Hello {John},M}}{ary,Di{{{gory,');
            });
            return it('should work when replacing with exact same value', function () {
                var content, scope, xmlTemplater;
                content = "<w:p><w:t xml:space=\"preserve\">Hello {name}</w:t></w:p>";
                scope = {
                    "name": "{name}"
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                xmlTemplater.render();
                xmlTemplater.getFullText();
                return expect(xmlTemplater.getFullText()).to.be.equal('Hello {name}');
            });
        });
        describe('Change the nullGetter', function () {
            return it('should work with null', function () {
                var content, parser, scope, xmlTemplater;
                content = "<w:t>Hello {name}</w:t>";
                scope = {};
                parser = function (tag) {
                    return "null";
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope,
                    nullGetter: parser
                });
                xmlTemplater.render();
                return expect(xmlTemplater.getFullText()).to.be.equal('Hello null');
            });
        });
        describe('Changing the parser', function () {
            it('should work with uppercassing', function () {
                var content, parser, scope, xmlTemplater;
                content = "<w:t>Hello {name}</w:t>";
                scope = {
                    "name": "Edgar"
                };
                parser = function (tag) {
                    return {
                        'get': function (scope) {
                            return scope[tag].toUpperCase();
                        }
                    };
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope,
                    parser: parser
                });
                xmlTemplater.render();
                return expect(xmlTemplater.getFullText()).to.be.equal('Hello EDGAR');
            });
            it('should work when setting from the DocXGen interface', function (done) {
                var d, tags;
                d = new DocxGen(docX["tagExample.docx"].loadedContent);
                tags = {
                    "first_name": "Hipp",
                    "last_name": "Edgar",
                    "phone": "0652455478",
                    "description": "New Website"
                };
                d.setData(tags);
                d.parser = function (tag) {
                    return {
                        'get': function (scope) {
                            return scope[tag].toUpperCase();
                        }
                    };
                };
                d.render().then(function(){
                    expect(d.getFullText()).to.be.equal('EDGAR HIPP');
                    expect(d.getFullText("word/header1.xml")).to.be.equal('EDGAR HIPP0652455478NEW WEBSITE');
                    expect(d.getFullText("word/footer1.xml")).to.be.equal('EDGARHIPP0652455478');
                    done();
                });
            });
            it('should work with angular parser', function (done) {
                var tags;
                tags = {
                    person: {
                        first_name: "Hipp",
                        last_name: "Edgar",
                        birth_year: 1955,
                        age: 59
                    }
                };
                docX["angularExample.docx"].setData(tags);
                docX["angularExample.docx"].parser = angularParser;
                docX["angularExample.docx"].render().then(function(){
                    expect(docX["angularExample.docx"].getFullText()).to.be.equal('Hipp Edgar 2014');
                    done();
                });
            });
            return it('should work with loops', function () {
                var content, scope, xmlTemplater;
                content = "<w:t>Hello {#person.adult}you{/person.adult}</w:t>";
                scope = {
                    "person": {
                        "name": "Edgar",
                        "adult": true
                    }
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope,
                    parser: angularParser
                });
                xmlTemplater.render();
                return expect(xmlTemplater.getFullText()).to.be.equal('Hello you');
            });
        });
        describe('Non Utf-8 characters', function () {
            it('should read full text correctly', function () {
                var fullText;
                fullText = docX["cyrillic.docx"].getFullText();
                expect(fullText.charCodeAt(0)).to.be.equal(1024);
                expect(fullText.charCodeAt(1)).to.be.equal(1050);
                expect(fullText.charCodeAt(2)).to.be.equal(1048);
                expect(fullText.charCodeAt(3)).to.be.equal(1046);
                expect(fullText.charCodeAt(4)).to.be.equal(1044);
                expect(fullText.charCodeAt(5)).to.be.equal(1045);
                expect(fullText.charCodeAt(6)).to.be.equal(1039);
                return expect(fullText.charCodeAt(7)).to.be.equal(1040);
            });
            it('should still read full text after applying tags', function (done) {
                var fullText;
                docX["cyrillic.docx"].setData({
                    name: "Edgar"
                });
                docX["cyrillic.docx"].render().then(function () {
                    fullText = docX["cyrillic.docx"].getFullText();
                    expect(fullText.charCodeAt(0)).to.be.equal(1024);
                    expect(fullText.charCodeAt(1)).to.be.equal(1050);
                    expect(fullText.charCodeAt(2)).to.be.equal(1048);
                    expect(fullText.charCodeAt(3)).to.be.equal(1046);
                    expect(fullText.charCodeAt(4)).to.be.equal(1044);
                    expect(fullText.charCodeAt(5)).to.be.equal(1045);
                    expect(fullText.charCodeAt(6)).to.be.equal(1039);
                    expect(fullText.charCodeAt(7)).to.be.equal(1040);
                    expect(fullText.indexOf('Edgar')).to.be.equal(9);
                    done();
                });
            });
            return it('should insert russian characters', function (done) {
                var char, d, outputText, russian, russianText;
                russianText = [1055, 1091, 1087, 1082, 1080, 1085, 1072];
                russian = (function () {
                    var j, len, results;
                    results = [];
                    for (j = 0, len = russianText.length; j < len; j++) {
                        char = russianText[j];
                        results.push(String.fromCharCode(char));
                    }
                    return results;
                })();
                russian = russian.join('');
                d = new DocxGen(docX["tagExample.docx"].loadedContent);
                d.setData({
                    last_name: russian
                });
                d.render().then(function () {
                    outputText = d.getFullText();
                    expect(outputText.substr(0, 7)).to.be.equal(russian);
                    done();
                })
            });
        });
        describe("errors", function () {
            it('should fail when rawtag not in paragraph', function () {
                var content, expectedError, scope, xmlTemplater;
                content = "<w:t>{@myrawtag}</w:t>";
                scope = {
                    "myrawtag": "<w:p><w:t>foobar</w:t></w:p>"
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                expectedError = {
                    name: "TemplateError",
                    message: "Can't find endTag",
                    properties: {
                        id: "raw_tag_outerxml_invalid",
                        text: "<w:t>{@myrawtag}</w:t>",
                        xmlTag: "w:p",
                        previousEnd: 16,
                        start: 5,
                        xtag: "@myrawtag"
                    }
                };
                expectToThrow(xmlTemplater, 'render', Errors.XTTemplateError, expectedError);
                content = "<w:t>{@myrawtag}</w:t></w:p>";
                scope = {
                    "myrawtag": "<w:p><w:t>foobar</w:t></w:p>"
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                expectedError = {
                    name: "TemplateError",
                    message: "Can't find startTag",
                    properties: {
                        id: "raw_tag_outerxml_invalid",
                        text: "<w:t>{@myrawtag}</w:t></w:p>",
                        xmlTag: "w:p",
                        previousEnd: 16,
                        start: 5,
                        xtag: "@myrawtag"
                    }
                };
                return expectToThrow(xmlTemplater, 'render', Errors.XTTemplateError, expectedError);
            });
            it('should fail when tag already opened', function () {
                var content, expectedError, xmlTemplater;
                content = "<w:t>{user {name}</w:t>";
                xmlTemplater = new DocXTemplater(content);
                expectedError = {
                    name: "TemplateError",
                    message: "Unclosed tag",
                    properties: {
                        id: "unclosed_tag",
                        context: "{user {",
                        xtag: "user "
                    }
                };
                return expectToThrow(xmlTemplater, 'render', Errors.XTTemplateError, expectedError);
            });
            it('should fail when tag already closed', function () {
                var content, expectedError, xmlTemplater;
                content = "<w:t>foobar}age</w:t>";
                xmlTemplater = new DocXTemplater(content);
                expectedError = {
                    name: "TemplateError",
                    message: "Unopened tag",
                    properties: {
                        id: "unopened_tag",
                        context: "foobar}"
                    }
                };
                return expectToThrow(xmlTemplater, 'render', Errors.XTTemplateError, expectedError);
            });
            it('should fail when customparser fails to compile', function () {
                var content, expectedError, xmlTemplater;
                content = "<w:t>{name++}</w:t>";
                xmlTemplater = new DocXTemplater(content, {
                    tags: {
                        name: 3
                    },
                    parser: angularParser
                });
                expectedError = {
                    name: "ScopeParserError",
                    message: "Scope parser compilation failed",
                    properties: {
                        id: "scopeparser_compilation_failed",
                        tag: "name++"
                    }
                };
                return expectToThrow(xmlTemplater, 'render', Errors.XTScopeParserError, expectedError);
            });
            it('should fail when customparser fails to execute', function () {
                var content, expectedError, xmlTemplater;
                content = "<w:t>{name|upper}</w:t>";
                xmlTemplater = new DocXTemplater(content, {
                    tags: {
                        name: 3
                    },
                    parser: angularParser
                });
                expectedError = {
                    name: "ScopeParserError",
                    message: "Scope parser execution failed",
                    properties: {
                        id: "scopeparser_execution_failed",
                        tag: "name|upper",
                        scope: {
                            name: 3
                        }
                    }
                };
                return expectToThrow(xmlTemplater, 'render', Errors.XTScopeParserError, expectedError);
            });
            it('should fail when rawtag is not only text in paragraph', function () {
                var content, expectedError, scope, xmlTemplater;
                content = "<w:p><w:t>{@myrawtag}</w:t><w:t>foobar</w:t></w:p>";
                scope = {
                    "myrawtag": "<w:p><w:t>foobar</w:t></w:p>"
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope
                });
                expectedError = {
                    name: "TemplateError",
                    message: "Raw xml tag should be the only text in paragraph",
                    properties: {
                        id: "raw_xml_tag_should_be_only_text_in_paragraph",
                        paragraphContent: "{@myrawtag}foobar",
                        xtag: "@myrawtag",
                        fullTag: "{@myrawtag}"
                    }
                };
                return expectToThrow(xmlTemplater, 'render', Errors.XTTemplateError, expectedError);
            });
            return describe('internal errors', function () {
                return it('should fail', function () {
                    var expectedError, test;
                    expectedError = {
                        name: "InternalError",
                        message: "Content must be a string",
                        properties: {
                            id: "xmltemplater_content_must_be_string"
                        }
                    };
                    test = {
                        fn: function () {
                            return new DocXTemplater(1);
                        }
                    };
                    return expectToThrow(test, 'fn', Errors.XTInternalError, expectedError);
                });
            });
        });
        describe('Complex table example', function () {
            it('should work with simple table', function (done) {
                var fullText;
                docX["tableComplex2Example.docx"].setData({
                    "table1": [
                        {
                            "t1data1": "t1-1row-data1",
                            "t1data2": "t1-1row-data2",
                            "t1data3": "t1-1row-data3",
                            "t1data4": "t1-1row-data4"
                        }, {
                            "t1data1": "t1-2row-data1",
                            "t1data2": "t1-2row-data2",
                            "t1data3": "t1-2row-data3",
                            "t1data4": "t1-2row-data4"
                        }, {
                            "t1data1": "t1-3row-data1",
                            "t1data2": "t1-3row-data2",
                            "t1data3": "t1-3row-data3",
                            "t1data4": "t1-3row-data4"
                        }
                    ],
                    "t1total1": "t1total1-data",
                    "t1total2": "t1total2-data",
                    "t1total3": "t1total3-data"
                });
                docX["tableComplex2Example.docx"].render()
                    .then(function () {
                        fullText = docX["tableComplex2Example.docx"].getFullText();
                        expect(fullText).to.be.equal("TABLE1COLUMN1COLUMN2COLUMN3COLUMN4t1-1row-data1t1-1row-data2t1-1row-data3t1-1row-data4t1-2row-data1t1-2row-data2t1-2row-data3t1-2row-data4t1-3row-data1t1-3row-data2t1-3row-data3t1-3row-data4TOTALt1total1-datat1total2-datat1total3-data");
                        done();
                    });
            });
            it('should work with more complex table', function (done) {
                var fullText;
                docX["tableComplexExample.docx"].setData({
                    "table2": [
                        {
                            "t2data1": "t2-1row-data1",
                            "t2data2": "t2-1row-data2",
                            "t2data3": "t2-1row-data3",
                            "t2data4": "t2-1row-data4"
                        }, {
                            "t2data1": "t2-2row-data1",
                            "t2data2": "t2-2row-data2",
                            "t2data3": "t2-2row-data3",
                            "t2data4": "t2-2row-data4"
                        }
                    ],
                    "t1total1": "t1total1-data",
                    "t1total2": "t1total2-data",
                    "t1total3": "t1total3-data",
                    "t2total1": "t2total1-data",
                    "t2total2": "t2total2-data",
                    "t2total3": "t2total3-data"
                });
                docX["tableComplexExample.docx"].render()
                    .then(function () {
                        fullText = docX["tableComplexExample.docx"].getFullText();
                        expect(fullText).to.be.equal("TABLE1COLUMN1COLUMN2COLUMN3COLUMN4TOTALt1total1-datat1total2-datat1total3-dataTABLE2COLUMN1COLUMN2COLUMN3COLUMN4t2-1row-data1t2-1row-data2t2-1row-data3t2-1row-data4t2-2row-data1t2-2row-data2t2-2row-data3t2-2row-data4TOTALt2total1-datat2total2-datat2total3-data");
                        done();
                    });
            });
            return it('should work with two tables and intelligentTagging', function () {
                var doc, expected, fullText, tags, template;
                tags = {
                    "table1": [1],
                    "key": "value"
                };
                template = "TAG\n<w:tr>\n<w:tc><w:t>{#table1}Hi</w:t></w:tc>\n<w:tc><w:t>{/table1}</w:t> </w:tc>\n</w:tr>\n<w:tr>\n<w:tc><w:t>{#table1}Ho</w:t></w:tc>\n<w:tc><w:p><w:t>{/table1}</w:t> </w:p>\n</w:tc>\n</w:tr>\n<w:t>{key}</w:t>\nTAG";
                doc = new DocXTemplater(template, {
                    tags: tags,
                    intelligentTagging: true
                });
                doc.render();
                fullText = doc.getFullText();
                expect(fullText).to.be.equal("HiHovalue");
                return expected = "TAG\n<w:tr>\n<w:tc><w:t xml:space=\"preserve\">Hi</w:t></w:tc>\n<w:tc><w:t xml:space=\"preserve\"></w:t> </w:tc>\n</w:tr>\n<w:tr>\n<w:tc><w:t xml:space=\"preserve\">Ho</w:t></w:tc>\n<w:tc><w:p><w:t xml:space=\"preserve\"></w:t> </w:p>\n</w:tc>\n</w:tr>\n<w:t xml:space=\"preserve\">value</w:t>\nTAG";
            });
        });
        describe('Raw Xml Insertion', function () {
            it("should work with simple example", function () {
                var content, doc, inner, scope;
                inner = "<w:p><w:r><w:t>{@complexXml}</w:t></w:r></w:p>";
                content = "<w:document>" + inner + "</w:document>";
                scope = {
                    "complexXml": "<w:p w:rsidR=\"00612058\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w:color w:val=\"FF0000\"/></w:rPr></w:pPr><w:r><w:rPr><w:color w:val=\"FF0000\"/></w:rPr><w:t>My custom XML</w:t></w:r></w:p><w:tbl><w:tblPr><w:tblStyle w:val=\"Grilledutableau\"/><w:tblW w:w=\"0\" w:type=\"auto\"/><w:tblLook w:val=\"04A0\" w:firstRow=\"1\" w:lastRow=\"0\" w:firstColumn=\"1\" w:lastColumn=\"0\" w:noHBand=\"0\" w:noVBand=\"1\"/></w:tblPr><w:tblGrid><w:gridCol w:w=\"2952\"/><w:gridCol w:w=\"2952\"/><w:gridCol w:w=\"2952\"/></w:tblGrid><w:tr w:rsidR=\"00EA4B08\" w:rsidTr=\"00EA4B08\"><w:tc><w:tcPr><w:tcW w:w=\"2952\" w:type=\"dxa\"/><w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"DDD9C3\" w:themeFill=\"background2\" w:themeFillShade=\"E6\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRPr=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w:b/><w:color w:val=\"000000\" w:themeColor=\"text1\"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:color w:val=\"000000\" w:themeColor=\"text1\"/></w:rPr><w:t>Test</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w=\"2952\" w:type=\"dxa\"/><w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"DDD9C3\" w:themeFill=\"background2\" w:themeFillShade=\"E6\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRPr=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w:b/><w:color w:val=\"FF0000\"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:color w:val=\"FF0000\"/></w:rPr><w:t>Xml</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w=\"2952\" w:type=\"dxa\"/><w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"DDD9C3\" w:themeFill=\"background2\" w:themeFillShade=\"E6\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w:color w:val=\"FF0000\"/></w:rPr></w:pPr><w:r><w:rPr><w:color w:val=\"FF0000\"/></w:rPr><w:t>Generated</w:t></w:r></w:p></w:tc></w:tr><w:tr w:rsidR=\"00EA4B08\" w:rsidTr=\"00EA4B08\"><w:tc><w:tcPr><w:tcW w:w=\"2952\" w:type=\"dxa\"/><w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"C6D9F1\" w:themeFill=\"text2\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRPr=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w:color w:val=\"000000\" w:themeColor=\"text1\"/><w:u w:val=\"single\"/></w:rPr></w:pPr><w:r w:rsidRPr=\"00EA4B08\"><w:rPr><w:color w:val=\"000000\" w:themeColor=\"text1\"/><w:u w:val=\"single\"/></w:rPr><w:t>Underline</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w=\"2952\" w:type=\"dxa\"/><w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"C6D9F1\" w:themeFill=\"text2\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w:color w:val=\"FF0000\"/></w:rPr></w:pPr><w:r w:rsidRPr=\"00EA4B08\"><w:rPr><w:color w:val=\"FF0000\"/><w:highlight w:val=\"yellow\"/></w:rPr><w:t>Highlighting</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w=\"2952\" w:type=\"dxa\"/><w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"C6D9F1\" w:themeFill=\"text2\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRPr=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w:rFonts w:ascii=\"Bauhaus 93\" w:hAnsi=\"Bauhaus 93\"/><w:color w:val=\"FF0000\"/></w:rPr></w:pPr><w:r w:rsidRPr=\"00EA4B08\"><w:rPr><w:rFonts w:ascii=\"Bauhaus 93\" w:hAnsi=\"Bauhaus 93\"/><w:color w:val=\"FF0000\"/></w:rPr><w:t>Font</w:t></w:r></w:p></w:tc></w:tr><w:tr w:rsidR=\"00EA4B08\" w:rsidTr=\"00EA4B08\"><w:tc><w:tcPr><w:tcW w:w=\"2952\" w:type=\"dxa\"/><w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"F2DBDB\" w:themeFill=\"accent2\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00EA4B08\"><w:pPr><w:jc w:val=\"center\"/><w:rPr><w:color w:val=\"FF0000\"/></w:rPr></w:pPr><w:r><w:rPr><w:color w:val=\"FF0000\"/></w:rPr><w:t>Centering</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w=\"2952\" w:type=\"dxa\"/><w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"F2DBDB\" w:themeFill=\"accent2\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRPr=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w:i/><w:color w:val=\"FF0000\"/></w:rPr></w:pPr><w:r w:rsidRPr=\"00EA4B08\"><w:rPr><w:i/><w:color w:val=\"FF0000\"/></w:rPr><w:t>Italic</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w=\"2952\" w:type=\"dxa\"/><w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"F2DBDB\" w:themeFill=\"accent2\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w:color w:val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc></w:tr><w:tr w:rsidR=\"00EA4B08\" w:rsidTr=\"00EA4B08\"><w:tc><w:tcPr><w:tcW w:w=\"2952\" w:type=\"dxa\"/><w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"E5DFEC\" w:themeFill=\"accent4\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w:color w:val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w=\"2952\" w:type=\"dxa\"/><w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"E5DFEC\" w:themeFill=\"accent4\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w:color w:val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w=\"2952\" w:type=\"dxa\"/><w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"E5DFEC\" w:themeFill=\"accent4\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w:color w:val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc></w:tr><w:tr w:rsidR=\"00EA4B08\" w:rsidTr=\"00EA4B08\"><w:tc><w:tcPr><w:tcW w:w=\"2952\" w:type=\"dxa\"/><w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"FDE9D9\" w:themeFill=\"accent6\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w:color w:val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w=\"2952\" w:type=\"dxa\"/><w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"FDE9D9\" w:themeFill=\"accent6\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w:color w:val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w=\"2952\" w:type=\"dxa\"/><w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"FDE9D9\" w:themeFill=\"accent6\" w:themeFillTint=\"33\"/></w:tcPr><w:p w:rsidR=\"00EA4B08\" w:rsidRDefault=\"00EA4B08\" w:rsidP=\"00612058\"><w:pPr><w:rPr><w:color w:val=\"FF0000\"/></w:rPr></w:pPr></w:p></w:tc></w:tr></w:tbl>"
                };
                doc = new DocXTemplater(content, {
                    tags: scope
                });
                doc.render();
                expect(doc.content.length).to.be.equal(content.length + scope.complexXml.length - inner.length);
                return expect(doc.content).to.contain(scope.complexXml);
            });
            it('should work even when tags are after the xml', function () {
                var content, doc, scope;
                content = "<w:tbl>\n    <w:tr>\n          <w:tc>\n                <w:p>\n                    <w:r>\n                    <w:t>{@complexXml}</w:t>\n                </w:r>\n            </w:p>\n        </w:tc>\n    </w:tr>\n    <w:tr>\n        <w:tc>\n            <w:p>\n                <w:r>\n                    <w:t>{name}</w:t>\n                </w:r>\n            </w:p>\n        </w:tc>\n    </w:tr>\n    <w:tr>\n        <w:tc>\n            <w:p>\n                <w:r>\n                    <w:t>{first_name}</w:t>\n                </w:r>\n            </w:p>\n        </w:tc>\n    </w:tr>\n    <w:tr>\n        <w:tc>\n            <w:p>\n                <w:r>\n                    <w:t>{#products} {year}</w:t>\n                </w:r>\n            </w:p>\n        </w:tc>\n        <w:tc>\n            <w:p>\n                <w:r>\n                    <w:t>{name}</w:t>\n                </w:r>\n            </w:p>\n        </w:tc>\n        <w:tc>\n            <w:p>\n                <w:r>\n                    <w:t>{company}{/products}</w:t>\n                </w:r>\n            </w:p>\n        </w:tc>\n    </w:tr>\n</w:tbl>";
                scope = {
                    "complexXml": "<w:p><w:r><w:t>Hello</w:t></w:r></w:p>",
                    "name": "John",
                    "first_name": "Doe",
                    "products": [
                        {
                            "year": 1550,
                            "name": "Moto",
                            "company": "Fein"
                        }, {
                            "year": 1987,
                            "name": "Water",
                            "company": "Test"
                        }, {
                            "year": 2010,
                            "name": "Bread",
                            "company": "Yu"
                        }
                    ]
                };
                doc = new DocXTemplater(content, {
                    tags: scope
                });
                doc.render();
                expect(doc.content).to.contain(scope.complexXml);
                return expect(doc.getFullText()).to.be.equal("HelloJohnDoe 1550MotoFein 1987WaterTest 2010BreadYu");
            });
            return it('should work with closing tag in the form of <w:t>}{/body}</w:t>', function () {
                var scope, xmlTemplater;
                scope = {
                    body: [
                        {
                            paragraph: "hello"
                        }
                    ]
                };
                xmlTemplater = new DocXTemplater("<w:t>{#body}</w:t>\n<w:t>{paragraph</w:t>\n<w:t>}{/body}</w:t>", {
                    tags: scope
                });
                xmlTemplater.render();
                return expect(xmlTemplater.content).not.to.contain('</w:t></w:t>');
            });
        });
        describe('SubContent', function () {
            var sub;
            sub = null;
            beforeEach(function () {
                sub = new SubContent("start<w:t>text</w:t>end");
                sub.start = 10;
                sub.end = 14;
                return sub.refreshText();
            });
            it("should get the text inside the tags correctly", function () {
                return expect(sub.text).to.be.equal('text');
            });
            it('should get the text expanded to the outer xml', function () {
                sub.getOuterXml('w:t');
                return expect(sub.text).to.be.equal('<w:t>text</w:t>');
            });
            it('should replace the inner text', function () {
                sub.getOuterXml('w:t');
                sub.replace('<w:table>Sample Table</w:table>');
                expect(sub.fullText).to.be.equal('start<w:table>Sample Table</w:table>end');
                return expect(sub.text).to.be.equal('<w:table>Sample Table</w:table>');
            });
            it('should work with custom tags', function () {
                var content, delimiters, scope, xmlTemplater;
                delimiters = {
                    start: '[',
                    end: ']'
                };
                content = "<w:t>Hello [name]</w:t>";
                scope = {
                    "name": "Edgar"
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope,
                    delimiters: delimiters
                });
                xmlTemplater.render();
                return expect(xmlTemplater.getFullText()).to.be.equal('Hello Edgar');
            });
            it('should work with custom tags as strings', function () {
                var content, delimiters, scope, xmlTemplater;
                delimiters = {
                    start: '[[',
                    end: ']]'
                };
                content = "<w:t>Hello [[name]]</w:t>";
                scope = {
                    "name": "Edgar"
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope,
                    delimiters: delimiters
                });
                xmlTemplater.render();
                expect(xmlTemplater.usedTags.def).to.be.eql({
                    'name': true
                });
                return expect(xmlTemplater.getFullText()).to.be.eql('Hello Edgar');
            });
            it('should work with custom tags as strings with different length', function () {
                var content, delimiters, scope, xmlTemplater;
                delimiters = {
                    start: '[[[',
                    end: ']]'
                };
                content = "<w:t>Hello [[[name]]</w:t>";
                scope = {
                    "name": "Edgar"
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope,
                    delimiters: delimiters
                });
                xmlTemplater.render();
                expect(xmlTemplater.usedTags.def).to.be.eql({
                    'name': true
                });
                return expect(xmlTemplater.getFullText()).to.be.eql('Hello Edgar');
            });
            it('should work with custom tags and loops', function () {
                var content, delimiters, scope, xmlTemplater;
                delimiters = {
                    start: '[[[',
                    end: ']]'
                };
                content = "<w:t>Hello [[[#names]][[[.]],[[[/names]]</w:t>";
                scope = {
                    "names": ["Edgar", "Mary", "John"]
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope,
                    delimiters: delimiters
                });
                xmlTemplater.render();
                return expect(xmlTemplater.getFullText()).to.be.equal('Hello Edgar,Mary,John,');
            });
            it('should work with custom tags, same for start and end', function () {
                var content, delimiters, scope, xmlTemplater;
                delimiters = {
                    start: '@',
                    end: '@'
                };
                content = "<w:t>Hello @name@</w:t>";
                scope = {
                    "name": "Edgar"
                };
                xmlTemplater = new DocXTemplater(content, {
                    tags: scope,
                    delimiters: delimiters
                });
                xmlTemplater.render();
                return expect(xmlTemplater.getFullText()).to.be.equal('Hello Edgar');
            });
            it('should work with loops', function () {
                var content, xmlt;
                content = "{innertag</w:t><w:t>}";
                xmlt = new DocXTemplater(content, {
                    tags: {
                        innertag: 5
                    }
                }).render();
                return expect(xmlt.content).to.be.equal('5</w:t><w:t xml:space="preserve">');
            });
            it('should work with complex loops (1)', function () {
                var content, xmlt;
                content = "<w:t>{#looptag}{innertag</w:t><w:t>}{/looptag}</w:t>";
                xmlt = new DocXTemplater(content, {
                    tags: {
                        looptag: true
                    }
                }).render();
                return expect(xmlt.content).not.to.contain('</w:t></w:t>');
            });
            it('should work with complex loops (2)', function () {
                var content, xmlt;
                content = "<w:t>{#person}</w:t><w:t>{name}{/person}</w:t>";
                xmlt = new DocXTemplater(content, {
                    tags: {
                        person: [
                            {
                                name: "Henry"
                            }
                        ]
                    }
                }).render();
                return expect(xmlt.content).not.to.contain('</w:t>Henry</w:t>');
            });
            it('should work with start and end (1)', function () {
                var content, xmlt;
                content = "a</w:t><w:t>{name}";
                xmlt = new DocXTemplater(content, {
                    tags: {
                        name: "Henry"
                    }
                }).render();
                return expect(xmlt.content).to.contain('a</w:t><w:t');
            });
            return it('should work with start and end (2)', function () {
                var content, xmlt;
                content = "{name}</w:t><w:t>a";
                xmlt = new DocXTemplater(content, {
                    tags: {
                        name: "Henry"
                    }
                }).render();
                return expect(xmlt.content).to.contain('Henry</w:t><w:t');
            });
        });
        describe('getting parents context', function () {
            it('should work with simple loops', function () {
                var content, xmlt;
                content = "{#loop}{name}{/loop}";
                xmlt = new DocXTemplater(content, {
                    tags: {
                        loop: [1],
                        name: "Henry"
                    }
                }).render();
                return expect(xmlt.content).to.be.equal("Henry");
            });
            return it('should work with double loops', function () {
                var content, xmlt;
                content = "{#loop_first}{#loop_second}{name_inner} {name_outer}{/loop_second}{/loop_first}";
                xmlt = new DocXTemplater(content, {
                    tags: {
                        loop_first: [1],
                        loop_second: [
                            {
                                name_inner: "John"
                            }
                        ],
                        name_outer: "Henry"
                    }
                }).render();
                return expect(xmlt.content).to.be.equal("John Henry");
            });
        });
        describe('speed test', function () {
            it('should be fast for simple tags', function () {
                var content, duration, i, j, time;
                content = "<w:t>tag {age}</w:t>";
                time = new Date();
                for (i = j = 1; j <= 100; i = ++j) {
                    new DocXTemplater(content, {
                        tags: {
                            age: 12
                        }
                    }).render();
                }
                duration = new Date() - time;
                return expect(duration).to.be.below(100);
            });
            return it('should be fast for simple tags with huge content', function () {
                var content, duration, i, j, prepost, time;
                content = "<w:t>tag {age}</w:t>";
                prepost = ((function () {
                    var j, results;
                    results = [];
                    for (i = j = 1; j <= 10000; i = ++j) {
                        results.push("bla");
                    }
                    return results;
                })()).join('');
                content = prepost + content + prepost;
                time = new Date();
                for (i = j = 1; j <= 50; i = ++j) {
                    new DocXTemplater(content, {
                        tags: {
                            age: 12
                        }
                    }).render();
                }
                duration = new Date() - time;
                return expect(duration).to.be.below(50);
            });
        });
        describe('pptx generation', function () {
            return it('should work with simple pptx', function (done) {
                var p;
                p = pptX['simpleExample.pptx'].setData({
                    'name': 'Edgar'
                });
                p.render().then(function () {
                    expect(p.getFullText()).to.be.equal('Hello Edgar');
                    done();
                });
            });
        });
        if (typeof window !== "undefined" && window !== null) {
            return window.mocha.run();
        }
    };

    countFiles = 0;

    allStarted = false;

    loadDocx = function (name, content) {
        docX[name] = new DocxGen();
        docX[name].load(content);
        return docX[name].loadedContent = content;
    };

    loadPptx = function (name, content) {
        pptX[name] = new PptxGen();
        pptX[name].load(content);
        return pptX[name].loadedContent = content;
    };

    loadImage = function (name, content) {
        return data[name] = content;
    };

    endLoadFile = function (change) {
        if (change == null) {
            change = 0;
        }
        countFiles += change;
        if (countFiles === 0 && allStarted === true) {
            return startTest();
        }
    };

    loadFile = function (name, callback) {
        countFiles += 1;
        if (fs.readFileSync != null) {
            callback(name, fs.readFileSync(__dirname + "/../../examples/" + name, "binary"));
            return endLoadFile(-1);
        }
        return JSZipUtils.getBinaryContent('../examples/' + name, function (err, data) {
            callback(name, data);
            return endLoadFile(-1);
        });
    };

    for (j = 0, len = fileNames.length; j < len; j++) {
        name = fileNames[j];
        loadFile(name, loadDocx);
    }

    loadFile('simpleExample.pptx', loadPptx);

    pngFiles = ['image.png'];

    for (k = 0, len1 = pngFiles.length; k < len1; k++) {
        file = pngFiles[k];
        loadFile(file, loadImage);
    }

    allStarted = true;

    if (typeof window !== "undefined" && window !== null) {
        setTimeout(endLoadFile, 200);
    } else {
        endLoadFile();
    }

}).call(this);
